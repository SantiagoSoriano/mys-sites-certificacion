-- =====================================================================
-- Migración 0004 — privacidad de ganancias en el leaderboard
-- =====================================================================
-- Los vendedores pueden ocultar su comisión total en el ranking público.
-- Su nombre y # de ventas siguen visibles — solo el monto se oculta.
-- Idempotente.
-- =====================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mostrar_ganancias BOOLEAN NOT NULL DEFAULT TRUE;

-- Policy: el user puede actualizar SOLO su propio mostrar_ganancias
-- (no debe poder cambiar rol, email, etc. desde el cliente)
DROP POLICY IF EXISTS users_self_toggle_privacy ON public.users;
CREATE POLICY users_self_toggle_privacy ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
