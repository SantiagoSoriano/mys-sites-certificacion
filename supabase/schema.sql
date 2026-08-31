-- =====================================================================
-- MyS Sites — Certificación de Ventas · schema inicial (v1)
-- =====================================================================
-- Correr TODO este archivo de un jalón en Supabase → SQL Editor → New query.
-- Idempotente: se puede volver a correr sin romper (usa IF NOT EXISTS y
-- DROP/CREATE en triggers/policies).
-- =====================================================================

-- =====================================================================
-- 1. EXTENSIONS + ENUMS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_rol AS ENUM ('vendedor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_estado AS ENUM ('activo', 'archivado', 'certificado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE practice_etapa AS ENUM ('guiado', 'multiple', 'libre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE business_dificultad AS ENUM ('facil', 'dificil');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prospect_estado AS ENUM (
    'disponible', 'asignado', 'en_venta', 'cerrado_venta',
    'cerrado_sin_venta', 'liberado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prospect_event_tipo AS ENUM (
    'asignado', 'contacto', 'seguimiento', 'listo_pago',
    'cerrado_venta', 'cerrado_sin_venta', 'liberado', 'reasignado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('temporada', 'negocio', 'completo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_estado AS ENUM (
    'mensaje_inicial_enviado', 'en_venta', 'listo_pago',
    'datos_enviados', 'comprobante_recibido', 'aprobado', 'pagado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE commission_estado AS ENUM ('pendiente', 'pagado_efectivo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 2. TABLAS CORE (usuario + curso + examen)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  nombre       TEXT NOT NULL,
  rol          user_rol NOT NULL DEFAULT 'vendedor',
  papas_email  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  dia_actual        INT NOT NULL DEFAULT 1 CHECK (dia_actual BETWEEN 1 AND 8),
  primera_fecha     DATE NOT NULL DEFAULT CURRENT_DATE,
  estado            enrollment_estado NOT NULL DEFAULT 'activo',
  ultima_actividad  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_activity (
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fecha                  DATE NOT NULL,
  practicas_completadas  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, fecha)
);

CREATE TABLE IF NOT EXISTS public.businesses_sim (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giro            TEXT NOT NULL,
  nombre_ficticio TEXT NOT NULL,
  dificultad      business_dificultad NOT NULL,
  personalidad    TEXT NOT NULL,
  objeciones      JSONB NOT NULL,
  prompt_base     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dia            INT NOT NULL CHECK (dia BETWEEN 1 AND 8),
  etapa          practice_etapa NOT NULL,
  business_id    UUID NOT NULL REFERENCES public.businesses_sim(id),
  transcripcion  JSONB NOT NULL DEFAULT '[]'::jsonb,
  score          INT,
  feedback       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_user_day
  ON public.practice_sessions (user_id, dia);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fecha                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  score_teorico            INT,
  score_practico           INT,
  aprobado                 BOOLEAN GENERATED ALWAYS AS
    (score_teorico >= 8 AND score_practico >= 8) STORED,
  transcripcion_teorico    JSONB,
  transcripcion_practico   JSONB,
  proximo_intento_ts       TIMESTAMPTZ NOT NULL DEFAULT now() + interval '12 hours'
);

CREATE INDEX IF NOT EXISTS idx_exam_user ON public.exam_attempts (user_id, fecha DESC);

CREATE TABLE IF NOT EXISTS public.certifications (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  fecha_certificacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 3. TABLAS DE VENTAS (prospectos + deals + comisiones)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.prospects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio              TEXT NOT NULL,
  contacto_nombre      TEXT,
  contacto_tel         TEXT,
  contacto_email       TEXT,
  giro                 TEXT,
  ciudad               TEXT,
  mapa_prospectos_id   TEXT,  -- id externo del Mapa de Prospectos (Flask)
  estado               prospect_estado NOT NULL DEFAULT 'disponible',
  asignado_a           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  asignado_desde       TIMESTAMPTZ,
  ultimo_seguimiento   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_asignado ON public.prospects (asignado_a);
CREATE INDEX IF NOT EXISTS idx_prospects_estado ON public.prospects (estado);

CREATE TABLE IF NOT EXISTS public.prospect_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tipo         prospect_event_tipo NOT NULL,
  notas        TEXT,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_prospect ON public.prospect_events (prospect_id, ts DESC);

CREATE TABLE IF NOT EXISTS public.deals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  vendedor_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  plan         plan_type NOT NULL,
  monto        NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  estado       deal_estado NOT NULL DEFAULT 'mensaje_inicial_enviado',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_vendedor ON public.deals (vendedor_id, estado);

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id        UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,  -- key en el bucket payment-proofs
  subido_por     UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  aprobado_por   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ts_subida      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ts_aprobacion  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id       UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  vendedor_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  monto         NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  estado        commission_estado NOT NULL DEFAULT 'pendiente',
  fecha_pago    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_vendedor
  ON public.commissions (vendedor_id, estado);

-- =====================================================================
-- 4. HELPERS + TRIGGERS
-- =====================================================================

-- 4a. Auto-crear row en public.users cuando alguien se registra en auth.users
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4b. is_admin() helper (SECURITY DEFINER para evitar recursion en RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT rol = 'admin' FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$;

-- 4c. updated_at automático en deals
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_deals_updated ON public.deals;
CREATE TRIGGER trg_deals_updated
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4d. Anti-fraude: solo admin puede mover deals a estados sensibles
CREATE OR REPLACE FUNCTION public.enforce_deal_admin_states()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado IN ('datos_enviados', 'aprobado', 'pagado')
     AND NEW.estado IS DISTINCT FROM OLD.estado
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el admin puede mover un deal a %', NEW.estado
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deals_antifraude ON public.deals;
CREATE TRIGGER trg_deals_antifraude
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.enforce_deal_admin_states();

-- =====================================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses_sim    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions       ENABLE ROW LEVEL SECURITY;

-- Helper: recrear policy sin errar si ya existe
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users','enrollments','daily_activity','businesses_sim',
        'practice_sessions','exam_attempts','certifications',
        'prospects','prospect_events','deals','payment_proofs','commissions'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- users: cada uno lee su row; admin lee todo. Nadie INSERT/UPDATE directo (el trigger lo crea).
CREATE POLICY users_self_select ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- enrollments: vendedor lee/escribe la suya; admin todo
CREATE POLICY enrollments_self_rw ON public.enrollments
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- daily_activity: vendedor lee/escribe lo suyo
CREATE POLICY daily_self_rw ON public.daily_activity
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- businesses_sim: todos los autenticados leen; solo admin edita
CREATE POLICY biz_read_all ON public.businesses_sim
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY biz_admin_write ON public.businesses_sim
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- practice_sessions: vendedor lee/escribe lo suyo
CREATE POLICY practice_self_rw ON public.practice_sessions
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- exam_attempts: idem
CREATE POLICY exams_self_rw ON public.exam_attempts
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- certifications: vendedor lee la suya; admin todo
CREATE POLICY certs_self_select ON public.certifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY certs_admin_write ON public.certifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- prospects: vendedor solo ve los suyos asignados; admin ve todo
CREATE POLICY prospects_assigned_select ON public.prospects
  FOR SELECT USING (asignado_a = auth.uid() OR public.is_admin());
CREATE POLICY prospects_assigned_update ON public.prospects
  FOR UPDATE USING (asignado_a = auth.uid() OR public.is_admin())
  WITH CHECK (asignado_a = auth.uid() OR public.is_admin());
CREATE POLICY prospects_admin_ins_del ON public.prospects
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY prospects_admin_delete ON public.prospects
  FOR DELETE USING (public.is_admin());

-- prospect_events: vendedor puede leer/insertar eventos de sus prospectos
CREATE POLICY events_own_select ON public.prospect_events
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.prospects p
      WHERE p.id = prospect_id AND p.asignado_a = auth.uid()
    )
  );
CREATE POLICY events_own_insert ON public.prospect_events
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.prospects p
      WHERE p.id = prospect_id AND p.asignado_a = auth.uid()
    )
  );

-- deals: vendedor ve/insert/update los suyos (excepto estados admin — ya está el trigger)
CREATE POLICY deals_own_select ON public.deals
  FOR SELECT USING (vendedor_id = auth.uid() OR public.is_admin());
CREATE POLICY deals_own_insert ON public.deals
  FOR INSERT WITH CHECK (vendedor_id = auth.uid() OR public.is_admin());
CREATE POLICY deals_own_update ON public.deals
  FOR UPDATE USING (vendedor_id = auth.uid() OR public.is_admin())
  WITH CHECK (vendedor_id = auth.uid() OR public.is_admin());
CREATE POLICY deals_admin_delete ON public.deals
  FOR DELETE USING (public.is_admin());

-- payment_proofs: vendedor ve/inserta las suyas (via deal); admin todo
CREATE POLICY proofs_own_select ON public.payment_proofs
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id AND d.vendedor_id = auth.uid()
    )
  );
CREATE POLICY proofs_own_insert ON public.payment_proofs
  FOR INSERT WITH CHECK (
    subido_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id AND d.vendedor_id = auth.uid()
    )
  );
CREATE POLICY proofs_admin_update ON public.payment_proofs
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- commissions: vendedor lee las suyas; solo admin escribe
CREATE POLICY commissions_own_select ON public.commissions
  FOR SELECT USING (vendedor_id = auth.uid() OR public.is_admin());
CREATE POLICY commissions_admin_write ON public.commissions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- 6. SEED — businesses_sim (5 fáciles + 5 difíciles)
-- =====================================================================

-- Limpio antes de reseed (idempotente)
DELETE FROM public.businesses_sim
WHERE nombre_ficticio IN (
  'Taquería Doña Chelo','Papelería El Lápiz Feliz','Cafetería La Terraza',
  'Peluquería Corte Real','Boutique Aurora','Ferretería El Tornillo',
  'Gimnasio Fuerza Puebla','Tienda de Ropa Trend','Dentista Dr. Ramírez',
  'Taller Mecánico Los Hermanos'
);

INSERT INTO public.businesses_sim (giro, nombre_ficticio, dificultad, personalidad, objeciones, prompt_base) VALUES
-- FÁCILES
('taquería', 'Taquería Doña Chelo', 'facil',
 'Doña Chelo, 58 años, dueña de una taquería con 20 años en Puebla. Cálida, curiosa, algo desconfiada con la tecnología pero abierta a escuchar.',
 '["no sé si vale la pena tener página","mis clientes son de aquí, ya me conocen","no soy muy buena con la computadora"]'::jsonb,
 'Eres Doña Chelo, dueña de una taquería tradicional en Puebla. Respondes con calidez y curiosidad. Preguntas cosas prácticas. No usas tecnicismos. Máximo 2 oraciones por respuesta, como si estuvieras contestando WhatsApp mientras atiendes.'
),
('papelería', 'Papelería El Lápiz Feliz', 'facil',
 'Karla, 32 años, dueña de una papelería cerca de una primaria. Práctica, ocupada, receptiva si le ahorras tiempo.',
 '["no tengo mucho tiempo para explicar","mis clientes son mamás que pasan por la escuela","¿cuánto tardarían?"]'::jsonb,
 'Eres Karla, dueña de una papelería frente a una primaria. Estás atendiendo mientras respondes. Directa pero amable. Valoras cosas que te faciliten la vida. Máximo 2 oraciones por respuesta.'
),
('cafetería', 'Cafetería La Terraza', 'facil',
 'Andrés, 28 años, abrió su cafetería hace un año. Moderno, activo en Instagram, entiende que la presencia digital importa.',
 '["ya tengo Instagram, ¿para qué la página?","estoy justo con presupuesto","¿en qué se diferencia de un Linktree?"]'::jsonb,
 'Eres Andrés, dueño joven de una cafetería moderna en Puebla. Amable, hablas informal, ya usas herramientas digitales. Preguntas cosas concretas de valor agregado. Máximo 2 oraciones por respuesta.'
),
('peluquería', 'Peluquería Corte Real', 'facil',
 'Doña Rosa, 45 años, peluquería de barrio con clientela fija. Le interesa modernizarse si es simple.',
 '["mis clientes agendan por WhatsApp, ¿para qué más?","no quiero algo complicado","¿me lo puedes explicar en simple?"]'::jsonb,
 'Eres Doña Rosa, dueña de una peluquería de barrio. Amable, hablas simple, valoras la sencillez. Máximo 2 oraciones por respuesta.'
),
('boutique', 'Boutique Aurora', 'facil',
 'Fernanda, 35 años, boutique de ropa para mujer. Estilo cuidado, quiere una página que se vea bonita.',
 '["quiero que se vea profesional, no genérica","¿puedo verla antes de decidir?","¿los cambios son rápidos?"]'::jsonb,
 'Eres Fernanda, dueña de una boutique con buen gusto. Directa, quieres calidad, cuidas el look. Máximo 2 oraciones por respuesta.'
),

-- DIFÍCILES
('ferretería', 'Ferretería El Tornillo', 'dificil',
 'Don Ramiro, 55 años, dueño de una ferretería con 25 años. Escéptico, tacaño con gastos nuevos, compara precio con todo.',
 '["¿qué me garantiza que me traiga clientes?","otro me dijo que me hacía una en 500 pesos","yo llevo años sin página y aquí sigo"]'::jsonb,
 'Eres Don Ramiro, dueño experimentado de una ferretería tradicional. Escéptico, tacaño, pesado para convencer. Comparas todo con opciones más baratas. Retas al vendedor con preguntas duras. Máximo 3 oraciones por respuesta.'
),
('gym', 'Gimnasio Fuerza Puebla', 'dificil',
 'Miguel, 40 años, dueño de un gym mediano. Ocupado, escuchó pitch de otras agencias, exige números.',
 '["¿cuántos clientes te ha traído esto a otros gyms?","ya me han vendido esto antes y no funcionó","¿en cuánto recupero la inversión?"]'::jsonb,
 'Eres Miguel, dueño de un gym mediano. Escéptico por experiencia, exiges datos concretos y ROI. Interrumpes con preguntas duras. Máximo 3 oraciones por respuesta.'
),
('tienda ropa', 'Tienda de Ropa Trend', 'dificil',
 'Alejandra, 30 años, tienda de ropa juvenil. Ya tiene web armada en Shopify y no le convence cambiar.',
 '["ya tengo Shopify, ¿por qué me pasaría?","¿me podrán manejar inventario también?","no quiero perder mi SEO actual"]'::jsonb,
 'Eres Alejandra, dueña de una tienda que ya usa Shopify. Técnica, exigente, defiendes lo que ya tienes. Máximo 3 oraciones por respuesta.'
),
('dentista', 'Dentista Dr. Ramírez', 'dificil',
 'Dr. Ramírez, 50 años, dentista con consultorio propio. Formal, valora la reputación, sospecha de vendedores jóvenes.',
 '["¿qué garantía profesional dan?","¿han trabajado con médicos antes?","mis pacientes llegan por recomendación, no por internet"]'::jsonb,
 'Eres el Dr. Ramírez, dentista formal y experimentado. Escéptico de la juventud del vendedor, exiges credenciales. Formal en el trato. Máximo 3 oraciones por respuesta.'
),
('taller mecánico', 'Taller Mecánico Los Hermanos', 'dificil',
 'Don Julio, 60 años, dueño de un taller familiar. Directo, práctico, cero paciencia con "modas".',
 '["yo no ando en internet, mis clientes tampoco","¿esto es una moda o de verdad sirve?","no me vayas a salir con letras chiquitas"]'::jsonb,
 'Eres Don Julio, dueño de un taller mecánico familiar de toda la vida. Directo, cortante, desconfías de "modas" y de vendedores jóvenes. Máximo 3 oraciones por respuesta.'
);

-- =====================================================================
-- 7. BACKFILL — crear public.users para auth.users que ya existan
-- =====================================================================

INSERT INTO public.users (id, email, nombre, rol)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  'vendedor'
FROM auth.users au
WHERE au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- FIN. Después de correr esto:
-- 1) Verifica en Table Editor que hay 12 tablas nuevas.
-- 2) En public.users deberías verte listado como 'vendedor'.
-- 3) Corre esta query para hacerte admin (reemplaza el email por el
--    que usaste para el Google login):
--
--    UPDATE public.users SET rol = 'admin'
--    WHERE email = 'tu-correo@gmail.com';
--
-- 4) SELECT * FROM public.businesses_sim; debe devolver 10 filas.
-- =====================================================================
