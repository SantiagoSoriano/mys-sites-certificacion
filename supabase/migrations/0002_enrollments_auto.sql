-- =====================================================================
-- Migración 0002 — enrollment automático al registrarse
-- =====================================================================
-- Extiende handle_new_user para crear también el enrollment inicial,
-- y hace backfill para users que ya existen sin enrollment.
-- Idempotente, seguro para re-correr.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'vendedor'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.enrollments (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill: enrollment para users existentes que aún no lo tengan
INSERT INTO public.enrollments (user_id)
SELECT u.id FROM public.users u
LEFT JOIN public.enrollments e ON e.user_id = u.id
WHERE e.user_id IS NULL;
