-- =====================================================================
-- Migración 0003 — tracking ligero de logins (geolocation por IP)
-- =====================================================================
-- Añade columnas para saber dónde y cuándo entra cada vendedor.
-- Los updates los hace el route handler /api/track-login con service role
-- (bypassing RLS) — no se agrega policy para que el user modifique estos
-- campos directamente.
-- Idempotente.
-- =====================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_city TEXT,
  ADD COLUMN IF NOT EXISTS last_login_country TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_login
  ON public.users (last_login_at DESC NULLS LAST);
