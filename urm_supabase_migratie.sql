-- AdviesFocus — URM Scenarioset Database
-- Supabase migratie: urm_scenariosets
-- Voer uit via: Supabase Dashboard → SQL Editor

-- ═══════════════════════════════════════════════════════════
-- TABEL: urm_scenariosets
-- Slaat metadata op van elke geüploade DNB kwartaalset
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS urm_scenariosets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kwartaal        TEXT NOT NULL UNIQUE,     -- bijv. '2026Q1'
  aangemaakt_op   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geupload_op     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geupload_door   UUID REFERENCES auth.users(id),
  n_scenarios     INTEGER NOT NULL,         -- aantal scenario's (20000)
  n_jaren         INTEGER NOT NULL,         -- simulatiehorizon in jaren
  bronbestand     TEXT NOT NULL,            -- originele DNB bestandsnaam
  kostenafslag_bps INTEGER NOT NULL DEFAULT 20,
  actief          BOOLEAN NOT NULL DEFAULT FALSE,  -- slechts 1 actieve set
  notitie         TEXT
);

-- Zorg dat er altijd maximaal 1 actieve set is
CREATE UNIQUE INDEX IF NOT EXISTS urm_scenariosets_actief_idx
  ON urm_scenariosets (actief)
  WHERE actief = TRUE;

-- ═══════════════════════════════════════════════════════════
-- TABEL: urm_lookup
-- De precomputed P5/P50/P95 factoren per (leeftijd × equity_pct)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS urm_lookup (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenarioset_id  UUID NOT NULL REFERENCES urm_scenariosets(id) ON DELETE CASCADE,
  leeftijd        SMALLINT NOT NULL CHECK (leeftijd BETWEEN 20 AND 66),
  equity_pct      SMALLINT NOT NULL CHECK (equity_pct BETWEEN 0 AND 100),
  horizon         SMALLINT NOT NULL,        -- AOW_leeftijd - leeftijd
  p5_factor       NUMERIC(10,4) NOT NULL,   -- pessimistisch
  p50_factor      NUMERIC(10,4) NOT NULL,   -- verwacht (mediaan)
  p95_factor      NUMERIC(10,4) NOT NULL,   -- optimistisch
  UNIQUE (scenarioset_id, leeftijd, equity_pct)
);

-- Index voor snelle lookups vanuit module C
CREATE INDEX IF NOT EXISTS urm_lookup_query_idx
  ON urm_lookup (scenarioset_id, leeftijd, equity_pct);

-- ═══════════════════════════════════════════════════════════
-- VIEW: actieve_urm_lookup
-- Module C gebruikt uitsluitend deze view — automatisch de actieve set
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW actieve_urm_lookup AS
SELECT
  ul.leeftijd,
  ul.equity_pct,
  ul.horizon,
  ul.p5_factor,
  ul.p50_factor,
  ul.p95_factor,
  us.kwartaal,
  us.n_scenarios,
  us.geupload_op
FROM urm_lookup ul
JOIN urm_scenariosets us ON ul.scenarioset_id = us.id
WHERE us.actief = TRUE;

-- ═══════════════════════════════════════════════════════════
-- FUNCTIE: activeer_scenarioset(kwartaal TEXT)
-- Zet de opgegeven set op actief, zet alle andere op inactief
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION activeer_scenarioset(p_kwartaal TEXT)
RETURNS void AS $$
BEGIN
  UPDATE urm_scenariosets SET actief = FALSE WHERE actief = TRUE;
  UPDATE urm_scenariosets SET actief = TRUE  WHERE kwartaal = p_kwartaal;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kwartaal % niet gevonden', p_kwartaal;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- Lees: alle ingelogde kantoorgebruikers mogen de actieve set lezen
-- Schrijf: alleen admins (via service_role of aparte admin-tabel)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE urm_scenariosets ENABLE ROW LEVEL SECURITY;
ALTER TABLE urm_lookup        ENABLE ROW LEVEL SECURITY;

-- Lezen voor ingelogde gebruikers
CREATE POLICY "urm_scenariosets_lees" ON urm_scenariosets
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "urm_lookup_lees" ON urm_lookup
  FOR SELECT TO authenticated USING (TRUE);

-- Schrijven alleen via service_role (backend / upload-API)
-- De uploadpagina gebruikt de Supabase service_role key via een
-- server-side API route (nooit in de browser blootstellen)
CREATE POLICY "urm_scenariosets_schrijf" ON urm_scenariosets
  FOR ALL TO service_role USING (TRUE);

CREATE POLICY "urm_lookup_schrijf" ON urm_lookup
  FOR ALL TO service_role USING (TRUE);

-- ═══════════════════════════════════════════════════════════
-- API ROUTE: /api/urm/upload  (Next.js route.ts — pseudocode)
-- ═══════════════════════════════════════════════════════════

/*
  POST /api/urm/upload
  Body: multipart/form-data  →  urm_lookup_2026Q1.json

  Logica:
  1. Authenticeer: controleer of gebruiker kantoor-admin is
  2. Lees JSON body (gegenereerd door dnb_urm_extract.py)
  3. INSERT INTO urm_scenariosets (kwartaal, n_scenarios, ...)
  4. Bulk INSERT INTO urm_lookup  (leeftijd, equity_pct, p5, p50, p95)
     via supabase.from('urm_lookup').insert(rows)
     (batches van 500 rijen om Supabase limiet te respecteren)
  5. Activeer de nieuwe set:
     SELECT activeer_scenarioset('2026Q1')

  Voorbeeld TypeScript (vereenvoudigd):

  import { createClient } from '@supabase/supabase-js'

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // nooit in browser
  )

  export async function POST(req: Request) {
    const form = await req.formData()
    const file = form.get('file') as File
    const json = JSON.parse(await file.text())

    // 1. Maak scenarioset-record aan
    const { data: set, error: setErr } = await supabase
      .from('urm_scenariosets')
      .insert({
        kwartaal:    json.meta.kwartaal,
        n_scenarios: json.meta.n_scenarios,
        n_jaren:     json.meta.n_jaren,
        bronbestand: json.meta.bronbestand,
      })
      .select()
      .single()

    if (setErr) return Response.json({ error: setErr }, { status: 500 })

    // 2. Bulk insert lookup rijen (in batches)
    const rows = json.lookup.map(r => ({
      scenarioset_id: set.id,
      leeftijd:    r.leeftijd,
      equity_pct:  r.equity_pct,
      horizon:     r.horizon,
      p5_factor:   r.p5_factor,
      p50_factor:  r.p50_factor,
      p95_factor:  r.p95_factor,
    }))

    const BATCH = 500
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase
        .from('urm_lookup')
        .insert(rows.slice(i, i + BATCH))
      if (error) return Response.json({ error }, { status: 500 })
    }

    // 3. Activeer
    await supabase.rpc('activeer_scenarioset', { p_kwartaal: json.meta.kwartaal })

    return Response.json({ ok: true, kwartaal: json.meta.kwartaal, rijen: rows.length })
  }
*/

-- ═══════════════════════════════════════════════════════════
-- MODULE C QUERY — zo haalt module C de factoren op
-- ═══════════════════════════════════════════════════════════

/*
  Voor werknemer leeftijd 45, lifecycle equity 60%:

  SELECT p5_factor, p50_factor, p95_factor, kwartaal
  FROM   actieve_urm_lookup
  WHERE  leeftijd   = 45
  AND    equity_pct = 60

  Rekenlogica in TypeScript (module-c):
    const jaarInleg    = grondslag * (premiePerc / 100)
    const kapitaalP5   = jaarInleg * row.p5_factor
    const kapitaalP50  = jaarInleg * row.p50_factor
    const kapitaalP95  = jaarInleg * row.p95_factor
    const maandP5      = kapitaalNaarMaand(kapitaalP5)   // annuïteit 20 jr
    const maandP50     = kapitaalNaarMaand(kapitaalP50)
    const maandP95     = kapitaalNaarMaand(kapitaalP95)
*/
