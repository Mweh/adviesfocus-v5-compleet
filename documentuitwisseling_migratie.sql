-- AdviesFocus — Flow 3: Veilige Documentuitwisseling
-- Supabase migratie: documenten + document_shares
-- Voer uit via: Supabase Dashboard → SQL Editor

-- ═══════════════════════════════════════════════════════════
-- TABEL: documenten
-- Elk bronbestand dat in het systeem bestaat.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documenten (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kantoor_id      UUID NOT NULL,                   -- eigenaar (adviseurskantoor)
  klant_id        UUID,                            -- optioneel: gekoppeld aan klant
  werknemer_id    UUID,                            -- optioneel: gekoppeld aan werknemer
  naam            TEXT NOT NULL,                   -- weergavenaam, bijv. "Adviesrapport Q1 2026"
  bestandsnaam    TEXT NOT NULL,                   -- originele filename
  bucket_pad      TEXT NOT NULL,                   -- pad in Supabase Storage bucket
  mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
  bestandsgrootte INTEGER,                         -- in bytes
  categorie       TEXT NOT NULL,                   -- zie categorieën hieronder
  richting        TEXT NOT NULL,                   -- 'adviseur_naar_werkgever' | 'werkgever_naar_adviseur'
                                                   -- | 'adviseur_naar_werknemer' | 'werknemer_naar_adviseur'
  status          TEXT NOT NULL DEFAULT 'actief',  -- 'actief' | 'verlopen' | 'gearchiveerd'
  aangemaakt_op   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aangemaakt_door UUID REFERENCES auth.users(id),
  notitie         TEXT
);

-- Geldige categorieën (afgedwongen via check)
ALTER TABLE documenten ADD CONSTRAINT doc_categorie_check CHECK (categorie IN (
  -- Adviseur → Werkgever
  'adviesrapport', 'auditrapport', 'offertevergelijking', 'transitieplan', 'overig_naar_werkgever',
  -- Werkgever → Adviseur
  'jaarrekening', 'salarisoverzicht', 'cao_document', 'or_notulen', 'overig_naar_adviseur',
  -- Adviseur → Werknemer
  'was_wordt_brief', 'pensioenbrief', 'upo', 'polisblad', 'overig_naar_werknemer',
  -- Werknemer → Adviseur
  'instemmingsformulier', 'bijlage_vraag', 'overig_van_werknemer'
));

-- ═══════════════════════════════════════════════════════════
-- TABEL: document_shares
-- Elke gedeelde link (token) voor een document.
-- Één document kan meerdere share-links hebben.
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS document_shares (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES documenten(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  richting          TEXT NOT NULL,            -- zelfde als documenten.richting
  ontvanger_type    TEXT NOT NULL,            -- 'werkgever' | 'werknemer' | 'adviseur'
  ontvanger_naam    TEXT,
  ontvanger_email   TEXT NOT NULL,
  geldig_tot        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  aangemaakt_op     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aangemaakt_door   UUID REFERENCES auth.users(id),
  gedownload_op     TIMESTAMPTZ,             -- eerste download
  downloads_totaal  INTEGER NOT NULL DEFAULT 0,
  max_downloads     INTEGER NOT NULL DEFAULT 5,
  bevestiging_naam  TEXT,                    -- ingevuld door ontvanger bij download
  bevestiging_ip    TEXT,                    -- voor audittrail
  verlopen          BOOLEAN NOT NULL DEFAULT FALSE,
  notitie           TEXT                     -- intern bericht van adviseur
);

-- Upload-tokens voor werkgever-uploads (richting werkgever→adviseur)
-- Aparte tabel: de werkgever krijgt een upload-token, geen download-token
CREATE TABLE IF NOT EXISTS upload_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  kantoor_id      UUID NOT NULL,
  klant_id        UUID,
  ontvanger_email TEXT NOT NULL,               -- adviseur die de uploads ontvangt
  aanvrager_email TEXT NOT NULL,               -- werkgever-emailadres (pre-ingevuld)
  aanvrager_naam  TEXT,
  geldig_tot      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
  aangemaakt_op   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aangemaakt_door UUID REFERENCES auth.users(id),
  gebruikt        BOOLEAN NOT NULL DEFAULT FALSE,
  uploads_totaal  INTEGER NOT NULL DEFAULT 0,
  max_uploads     INTEGER NOT NULL DEFAULT 10,
  toegestane_types TEXT[] DEFAULT ARRAY['application/pdf','text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  max_bestand_mb  INTEGER NOT NULL DEFAULT 25
);

-- Geüploade bestanden via upload-token
CREATE TABLE IF NOT EXISTS token_uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_token_id UUID NOT NULL REFERENCES upload_tokens(id) ON DELETE CASCADE,
  document_id     UUID REFERENCES documenten(id),   -- aangemaakt na upload
  bestandsnaam    TEXT NOT NULL,
  bestandsgrootte INTEGER,
  mime_type       TEXT,
  geupload_op     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geupload_door_ip TEXT,
  status          TEXT NOT NULL DEFAULT 'ontvangen'  -- 'ontvangen' | 'verwerkt' | 'afgewezen'
);

-- Leesbevestigingen (werknemer → bevestigt ontvangst)
CREATE TABLE IF NOT EXISTS lees_bevestigingen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id      UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  bevestigd_op  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_adres      TEXT,
  user_agent    TEXT
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS doc_klant_idx    ON documenten (klant_id);
CREATE INDEX IF NOT EXISTS doc_kantoor_idx  ON documenten (kantoor_id);
CREATE INDEX IF NOT EXISTS share_token_idx  ON document_shares (token);
CREATE INDEX IF NOT EXISTS share_doc_idx    ON document_shares (document_id);
CREATE INDEX IF NOT EXISTS upload_token_idx ON upload_tokens (token);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
ALTER TABLE documenten         ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares    ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_uploads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lees_bevestigingen ENABLE ROW LEVEL SECURITY;

-- Adviseur leest/schrijft eigen kantoor-documenten
CREATE POLICY "doc_eigen_kantoor" ON documenten
  FOR ALL TO authenticated
  USING (kantoor_id = (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

CREATE POLICY "shares_eigen_kantoor" ON document_shares
  FOR ALL TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documenten
      WHERE kantoor_id = (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid())
    )
  );

CREATE POLICY "upload_tokens_eigen_kantoor" ON upload_tokens
  FOR ALL TO authenticated
  USING (kantoor_id = (SELECT kantoor_id FROM gebruikers WHERE id = auth.uid()));

-- Service role heeft volledige toegang (publieke pagina's)
CREATE POLICY "doc_service_role"   ON documenten         FOR ALL TO service_role USING (TRUE);
CREATE POLICY "share_service_role" ON document_shares    FOR ALL TO service_role USING (TRUE);
CREATE POLICY "token_service_role" ON upload_tokens      FOR ALL TO service_role USING (TRUE);
CREATE POLICY "tu_service_role"    ON token_uploads      FOR ALL TO service_role USING (TRUE);
CREATE POLICY "lb_service_role"    ON lees_bevestigingen FOR ALL TO service_role USING (TRUE);

-- ═══════════════════════════════════════════════════════════
-- SUPABASE STORAGE
-- ═══════════════════════════════════════════════════════════

-- Bucket aanmaken (run via Supabase dashboard of Management API):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'gedeelde-documenten',
--   'gedeelde-documenten',
--   FALSE,                    -- NIET publiek — altijd via signed URL
--   26214400,                 -- 25 MB limiet
--   ARRAY[
--     'application/pdf',
--     'text/csv',
--     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--     'image/png', 'image/jpeg'
--   ]
-- );

-- Storage pad-structuur:
-- gedeelde-documenten/
--   {kantoor_id}/
--     werkgever/          ← bestanden van/naar werkgever
--       {klant_id}/
--         {document_id}_{bestandsnaam}
--     werknemer/          ← bestanden van/naar werknemer
--       {klant_id}/
--         {werknemer_id}/
--           {document_id}_{bestandsnaam}

-- RLS op storage (alleen via signed URL, nooit direct publiek):
-- CREATE POLICY "storage_kantoor" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'gedeelde-documenten'
--     AND (storage.foldername(name))[1] = (
--       SELECT kantoor_id::text FROM gebruikers WHERE id = auth.uid()
--     )
--   );

-- ═══════════════════════════════════════════════════════════
-- FUNCTIES
-- ═══════════════════════════════════════════════════════════

-- Valideer en registreer een download (public, via service_role)
CREATE OR REPLACE FUNCTION registreer_download(
  p_token TEXT,
  p_bevestiging_naam TEXT,
  p_ip TEXT
) RETURNS JSON AS $$
DECLARE
  v_share document_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share FROM document_shares WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Token niet gevonden');
  END IF;

  IF v_share.verlopen OR v_share.geldig_tot < NOW() THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Link verlopen');
  END IF;

  IF v_share.downloads_totaal >= v_share.max_downloads THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Maximum downloads bereikt');
  END IF;

  UPDATE document_shares SET
    downloads_totaal  = downloads_totaal + 1,
    gedownload_op     = COALESCE(gedownload_op, NOW()),
    bevestiging_naam  = p_bevestiging_naam,
    bevestiging_ip    = p_ip
  WHERE token = p_token;

  RETURN json_build_object(
    'ok',          TRUE,
    'document_id', v_share.document_id,
    'share_id',    v_share.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Valideer upload-token
CREATE OR REPLACE FUNCTION valideer_upload_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE v_tok upload_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_tok FROM upload_tokens WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Token niet gevonden');
  END IF;
  IF v_tok.geldig_tot < NOW() THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Upload-link verlopen');
  END IF;
  IF v_tok.uploads_totaal >= v_tok.max_uploads THEN
    RETURN json_build_object('ok', FALSE, 'fout', 'Maximum uploads bereikt');
  END IF;
  RETURN json_build_object(
    'ok',             TRUE,
    'kantoor_id',     v_tok.kantoor_id,
    'klant_id',       v_tok.klant_id,
    'aanvrager_naam', v_tok.aanvrager_naam,
    'max_bestand_mb', v_tok.max_bestand_mb,
    'resterend',      v_tok.max_uploads - v_tok.uploads_totaal
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
