import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AppUser = {
  id: string;
  email: string;
  nombre: string;
  rol: "vendedor" | "admin";
};

export type Enrollment = {
  user_id: string;
  dia_actual: number;
  primera_fecha: string;
  estado: "activo" | "archivado" | "certificado";
  ultima_actividad: string;
};

/**
 * Fetches the current auth user + their public.users row.
 * Redirects to /login if there's no session.
 */
export async function requireUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: AppUser;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, nombre, rol")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    // Should never happen if trigger + backfill ran, but guard anyway
    redirect("/login?error=no_profile");
  }

  return { supabase, user: profile as AppUser };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (user.rol !== "admin") redirect("/dashboard");
  return { supabase, user };
}

export type DashboardData = {
  enrollment: Enrollment | null;
  practicaHoyCompletada: boolean;
  prospectosActivos: number;
  dealsEnCurso: number;
  comisionPendiente: number;
  comisionPagada: number;
  certificado: boolean;
};

export async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    enrollmentRes,
    dailyRes,
    prospectsRes,
    dealsRes,
    commissionsRes,
    certRes,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("user_id, dia_actual, primera_fecha, estado, ultima_actividad")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_activity")
      .select("practicas_completadas")
      .eq("user_id", userId)
      .eq("fecha", today)
      .maybeSingle(),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("asignado_a", userId)
      .in("estado", ["asignado", "en_venta"]),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("vendedor_id", userId)
      .not("estado", "in", "(aprobado,pagado)"),
    supabase
      .from("commissions")
      .select("monto, estado")
      .eq("vendedor_id", userId),
    supabase
      .from("certifications")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const comisiones = commissionsRes.data ?? [];
  const comisionPendiente = comisiones
    .filter((c) => c.estado === "pendiente")
    .reduce((sum, c) => sum + Number(c.monto), 0);
  const comisionPagada = comisiones
    .filter((c) => c.estado === "pagado_efectivo")
    .reduce((sum, c) => sum + Number(c.monto), 0);

  return {
    enrollment: (enrollmentRes.data as Enrollment | null) ?? null,
    practicaHoyCompletada: (dailyRes.data?.practicas_completadas ?? 0) > 0,
    prospectosActivos: prospectsRes.count ?? 0,
    dealsEnCurso: dealsRes.count ?? 0,
    comisionPendiente,
    comisionPagada,
    certificado: !!certRes.data,
  };
}

export type AdminOverview = {
  vendedoresActivos: number;
  dealsPendientesAprobacion: number;
  prospectosSinAsignar: number;
  comisionesPorPagar: number;
};

export async function getAdminOverview(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminOverview> {
  const [vendedores, deals, prospects, commissions] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("rol", "vendedor"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("estado", "comprobante_recibido"),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .in("estado", ["disponible", "liberado"]),
    supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
  ]);

  return {
    vendedoresActivos: vendedores.count ?? 0,
    dealsPendientesAprobacion: deals.count ?? 0,
    prospectosSinAsignar: prospects.count ?? 0,
    comisionesPorPagar: commissions.count ?? 0,
  };
}

export function pesos(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
