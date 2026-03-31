-- ═══════════════════════════════════════════════════════════
-- AdviesFocus — Complete Database Schema
-- Jalankan SEMUA SQL files berikut di Supabase SQL Editor:
-- 1. file ini (schema_baru.sql)
-- 2. documentuitwisseling_migratie.sql
-- 3. urm_supabase_migratie.sql
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- TABEL: kantoren (advieskantoren)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS kantoren (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam              TEXT NOT NULL,
  afm               TEXT,
  email             TEXT,
  telefoon          TEXT,
  adres             TEXT,
  primair_kleur     TEXT DEFAULT '#1d9e75',
  brief_aanhef      TEXT DEFAULT 'Geachte heer/mevrouw',
  brief_afsluiting  TEXT DEFAULT 'Met vriendelijke groet,',
  toon_wetsartikelen BOOLEAN DEFAULT TRUE,
  abonnement        TEXT DEFAULT 'Basis' CHECK (abonnement IN ('Basis', 'Pro', 'Enterprise')),
  abonnement_prijs  NUMERIC DEFAULT 149,
  volgende_faktuur  DATE,
  max_gebruikers    INTEGER DEFAULT 3,
  aangemaakt_op     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: gebruikers (adviseurs, gekoppeld aan auth.users)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gebruikers (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kantoor_id        UUID NOT NULL REFERENCES kantoren(id),
  naam              TEXT NOT NULL,
  email             TEXT NOT NULL,
  rol               TEXT DEFAULT 'adviseur' CHECK (rol IN ('beheerder', 'adviseur')),
  actief            BOOLEAN DEFAULT TRUE,
  twofa             BOOLEAN DEFAULT FALSE,
  dossiers_count    INTEGER DEFAULT 0,
  aangemaakt_op     TIMESTAMPTZ DEFAULT NOW(),
  laaste_actief     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: klanten (werkgevers / werkgever-clients)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS klanten (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kantoor_id          UUID NOT NULL REFERENCES kantoren(id),
  adviseur_id         UUID REFERENCES gebruikers(id),
  naam                TEXT NOT NULL,
  kvk                 TEXT,
  contact_naam        TEXT,
  contact_email       TEXT,
  contact_telefoon    TEXT,
  contact_functie     TEXT,
  straat              TEXT,
  postcode            TEXT,
  stad                TEXT,
  cao                 TEXT,
  bpf                 TEXT DEFAULT 'Geen BPF-plicht',
  status              TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'actief', 'beheer', 'gearchiveerd')),
  fase                TEXT CHECK (fase IN ('inventarisatie', 'analyse', 'rapport', 'communicatie', 'instemming', 'nazorg', 'beheer', NULL)),
  loonsom             NUMERIC DEFAULT 0,
  werknemers_aantal   INTEGER DEFAULT 0,
  franchise           NUMERIC DEFAULT 17545,
  doel_premie_perc    NUMERIC DEFAULT 20,
  huidig_uitvoerder   TEXT,
  huidig_premie_perc  NUMERIC,
  progress            INTEGER DEFAULT 0,
  aangemaakt_op       TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op       TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: werknemers (werknemers van klanten)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS werknemers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klant_id            UUID NOT NULL REFERENCES klanten(id) ON DELETE CASCADE,
  naam                TEXT NOT NULL,
  voornaam            TEXT,
  geboortejaar        INTEGER,
  leeftijd            INTEGER,
  email               TEXT,
  telefoon            TEXT,
  salaris             NUMERIC NOT NULL,
  parttime_perc       NUMERIC DEFAULT 100,
  dienstjaren         INTEGER DEFAULT 0,
  in_dienst_datum     DATE,
  uit_dienst_datum    DATE,
  burgelijke_staat    TEXT DEFAULT 'onbekend' CHECK (burgelijke_staat IN ('onbekend', 'gehuwd', 'ongehuwd', 'gescheiden', 'weduwe')),
  partner_inkomen     TEXT CHECK (partner_inkomen IN ('geen', 'onder_anw', 'tussen_anw_en_max', 'boven_max', NULL)),
  instemming_status   TEXT DEFAULT 'niet_verstuurd' CHECK (instemming_status IN ('niet_verstuurd', 'verstuurd', 'ingestemd', 'bezwaar')),
  portaal_actief      BOOLEAN DEFAULT FALSE,
  portaal_uitgenodigd_op TIMESTAMPTZ,
  trigger_info        TEXT,
  aangemaakt_op       TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op       TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: pensioengegevens (per werknemer)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pensioengegevens (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  werknemer_id          UUID NOT NULL REFERENCES werknemers(id) ON DELETE CASCADE,
  klant_id              UUID NOT NULL REFERENCES klanten(id),
  peildatum             DATE DEFAULT CURRENT_DATE,
  uitvoerder_huidig     TEXT,
  polis_nummer          TEXT,
  opbouw_perc           NUMERIC,
  franchise             NUMERIC DEFAULT 17545,
  grondslag             NUMERIC,
  jaarpremie            NUMERIC,
  pensioen_leeftijd     INTEGER DEFAULT 67,
  partner_pensioen      NUMERIC,
  wezen_pensioen        NUMERIC,
  arbeidsongeschiktheid TEXT,
  nabestaanden_keuze    TEXT,
  aangemaakt_op         TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op         TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: instemmingen (werknemer instemming bij WTP)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS instemmingen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  werknemer_id      UUID NOT NULL REFERENCES werknemers(id) ON DELETE CASCADE,
  klant_id          UUID NOT NULL REFERENCES klanten(id),
  status            TEXT DEFAULT 'niet_verstuurd' CHECK (status IN ('niet_verstuord', 'verstuurd', 'ingestemd', 'bezwaar', 'getekend')),
  verstuurd_op      TIMESTAMPTZ,
  ingestemd_op      TIMESTAMPTZ,
  bezwaar_op        TIMESTAMPTZ,
  bezwaar_reden     TEXT,
  bezwaar_opgelost  BOOLEAN DEFAULT FALSE,
  ip_adres          INET,
  user_agent        TEXT,
  token             TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  aangemaakt_op     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: dossiers (case files / document tracking)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dossiers (
  id                TEXT PRIMARY KEY,
  kantoor_id        UUID NOT NULL REFERENCES kantoren(id),
  klant_id          UUID REFERENCES klanten(id),
  adviseur_id       UUID REFERENCES gebruikers(id),
  type              TEXT NOT NULL CHECK (type IN ('adviesrapport', 'inventarisatie', 'audit', 'beheer', 'transitieplan')),
  status            TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'review', 'voltooid')),
  gevalideerd       BOOLEAN DEFAULT FALSE,
  datum             DATE DEFAULT CURRENT_DATE,
  aangemaakt_op     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: mutaties (werknemer mutaties / wijzigingen)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mutaties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klant_id          UUID NOT NULL REFERENCES klanten(id) ON DELETE CASCADE,
  werknemer_id      UUID REFERENCES werknemers(id),
  type              TEXT NOT NULL CHECK (type IN ('salariswijziging', 'nieuwe_medewerker', 'uit_dienst', 'overig')),
  beschrijving      TEXT,
  oude_waarde       TEXT,
  nieuwe_waarde     TEXT,
  status            TEXT DEFAULT 'wachtend' CHECK (status IN ('wachtend', 'goedgekeurd', 'afgewezen')),
  geimporteerd_op   TIMESTAMPTZ DEFAULT NOW(),
  verwerkt_op       TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: audit_log (actielog voor compliance)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kantoor_id        UUID NOT NULL REFERENCES kantoren(id),
  gebruiker_id      UUID REFERENCES gebruikers(id),
  gebruiker_naam    TEXT,
  actie             TEXT NOT NULL,
  dossier_id        TEXT,
  klant_id          UUID,
  klant_naam        TEXT,
  ip_adres          INET,
  tijdstip          TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: parameters (systeemparameters)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS parameters (
  id                TEXT PRIMARY KEY,
  naam              TEXT NOT NULL,
  waarde            TEXT NOT NULL,
  jaar              TEXT,
  bron              TEXT,
  bijgewerkt_op     DATE DEFAULT CURRENT_DATE,
  status            TEXT DEFAULT 'actueel'
);

-- Seed parameters
INSERT INTO parameters (id, naam, waarde, jaar, bron, status) VALUES
  ('franchise',    'Franchise (AOW-drempel)',       '17545', '2026', 'Belastingdienst',       'actueel'),
  ('anw',          'ANW-uitkering bruto/mnd',       '1643',  '2026', 'SVB',                   'actueel'),
  ('staffel_min',  'Staffelpremie minimaal',        '5.4',   '2026', 'Commissie Parameters',  'actueel'),
  ('staffel_max',  'Staffelpremie maximaal',        '32.2',  '2026', 'Commissie Parameters',  'actueel'),
  ('max_premie',   'Max. pensioenpremie',           '30',    '2026', 'Wtp / Belastingdienst', 'actueel'),
  ('cao_entries',  'CAO-codelijst entries',         '1589',  '2026', 'SZW',                   'actueel')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS gebruikers_kantoor_idx   ON gebruikers (kantoor_id);
CREATE INDEX IF NOT EXISTS klanten_kantoor_idx      ON klanten (kantoor_id);
CREATE INDEX IF NOT EXISTS klanten_adviseur_idx     ON klanten (adviseur_id);
CREATE INDEX IF NOT EXISTS werknemers_klant_idx     ON werknemers (klant_id);
CREATE INDEX IF NOT EXISTS pensioen_werknemer_idx   ON pensioengegevens (werknemer_id);
CREATE INDEX IF NOT EXISTS instemming_werknemer_idx ON instemmingen (werknemer_id);
CREATE INDEX IF NOT EXISTS mutaties_klant_idx       ON mutaties (klant_id);
CREATE INDEX IF NOT EXISTS dossiers_kantoor_idx     ON dossiers (kantoor_id);
CREATE INDEX IF NOT EXISTS audit_kantoor_idx        ON audit_log (kantoor_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
ALTER TABLE kantoren          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gebruikers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE klanten           ENABLE ROW LEVEL SECURITY;
ALTER TABLE werknemers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pensioengegevens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE instemmingen      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutaties          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters        ENABLE ROW LEVEL SECURITY;

-- Kantoor: gebruiker ziet eigen kantoor
CREATE POLICY "kantoren_eigen" ON kantoren
  FOR ALL TO authenticated
  USING (id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Gebruikers: ziet eigen kantoor-gebruikers
CREATE POLICY "gebruikers_eigen_kantoor" ON gebruikers
  FOR ALL TO authenticated
  USING (kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Klanten: adviseur ziet eigen kantoor-klanten
CREATE POLICY "klanten_eigen_kantoor" ON klanten
  FOR ALL TO authenticated
  USING (kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Werknemers: via klant -> kantoor
CREATE POLICY "werknemers_eigen_kantoor" ON werknemers
  FOR ALL TO authenticated
  USING (klant_id IN (
    SELECT id FROM klanten
    WHERE kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid())
  ));

-- Pensioengegevens: via werknemer -> klant -> kantoor
CREATE POLICY "pensioen_eigen_kantoor" ON pensioengegevens
  FOR ALL TO authenticated
  USING (klant_id IN (
    SELECT id FROM klanten
    WHERE kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid())
  ));

-- Instemmingen: via klant -> kantoor
CREATE POLICY "instemming_eigen_kantoor" ON instemmingen
  FOR ALL TO authenticated
  USING (klant_id IN (
    SELECT id FROM klanten
    WHERE kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid())
  ));

-- Dossiers: eigen kantoor
CREATE POLICY "dossiers_eigen_kantoor" ON dossiers
  FOR ALL TO authenticated
  USING (kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Mutaties: via klant -> kantoor
CREATE POLICY "mutaties_eigen_kantoor" ON mutaties
  FOR ALL TO authenticated
  USING (klant_id IN (
    SELECT id FROM klanten
    WHERE kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid())
  ));

-- Audit log: eigen kantoor
CREATE POLICY "audit_eigen_kantoor" ON audit_log
  FOR SELECT TO authenticated
  USING (kantoor_id IN (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Parameters: iedereen mag lezen
CREATE POLICY "parameters_leesbaar" ON parameters
  FOR SELECT TO authenticated USING (TRUE);

-- Service role: volledige toegang
CREATE POLICY "kantoren_service" ON kantoren          FOR ALL TO service_role USING (TRUE);
CREATE POLICY "gebruikers_service" ON gebruikers      FOR ALL TO service_role USING (TRUE);
CREATE POLICY "klanten_service" ON klanten            FOR ALL TO service_role USING (TRUE);
CREATE POLICY "werknemers_service" ON werknemers      FOR ALL TO service_role USING (TRUE);
CREATE POLICY "pensioen_service" ON pensioengegevens  FOR ALL TO service_role USING (TRUE);
CREATE POLICY "instemming_service" ON instemmingen    FOR ALL TO service_role USING (TRUE);
CREATE POLICY "dossiers_service" ON dossiers          FOR ALL TO service_role USING (TRUE);
CREATE POLICY "mutaties_service" ON mutaties          FOR ALL TO service_role USING (TRUE);
CREATE POLICY "audit_service" ON audit_log            FOR ALL TO service_role USING (TRUE);
CREATE POLICY "parameters_service" ON parameters      FOR ALL TO service_role USING (TRUE);

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKET (voor document uploads)
-- ═══════════════════════════════════════════════════════════
-- Voer dit handmatig uit in Supabase Dashboard > Storage:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('gedeelde-documenten', 'gedeelde-documenten', FALSE, 26214400);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: nieuw auth.user → automatisch gebruiker record
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gebruikers (id, naam, email, kantoor_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'naam', 'Nieuwe gebruiker'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'kantoor_id')::UUID, gen_random_uuid())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- (Uncomment bovenstaande na het aanmaken van de eerste kantoor + gebruiker handmatig)
