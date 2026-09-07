-- Notificaciones sencillas por vendedor.
-- Tipos actuales:
--   'nuevo_asignado'  → el cron o alguien te asignó un prospect
--   'liberado'        → un prospect volvió al pool (futuro)

CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,
  titulo       TEXT NOT NULL,
  cuerpo       TEXT,
  prospect_id  UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
  leido        BOOLEAN NOT NULL DEFAULT false,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, leido, ts DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_self_r ON public.notifications;
CREATE POLICY notifications_self_r ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_self_u ON public.notifications;
CREATE POLICY notifications_self_u ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Admin lee todas (para debug)
DROP POLICY IF EXISTS notifications_admin_r ON public.notifications;
CREATE POLICY notifications_admin_r ON public.notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.rol = 'admin')
  );
