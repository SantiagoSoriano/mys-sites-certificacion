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
  ingresosTotalesCobrados: number;
  ingresosPotencialesPendientes: number;
  topVendedor: { nombre: string; monto: number } | null;
  certificados: number;
  leaderboardEntrenamiento: LeaderEntrenamiento[];
  leaderboardCertificados: LeaderCertificado[];
};

export type LeaderEntrenamiento = {
  id: string;
  nombre: string;
  dia: number;
  practicasCompletadas: number;
  scorePromedio: number | null;
};

export type LeaderCertificado = {
  id: string;
  nombre: string;
  fechaCert: string;
  comisionTotal: number;
  ventasCerradas: number;
};

export type RecentLogin = {
  id: string;
  nombre: string;
  email: string;
  city: string | null;
  country: string | null;
  at: string;
};

export async function getRecentLogins(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit = 8
): Promise<RecentLogin[]> {
  const { data } = await supabase
    .from("users")
    .select("id, nombre, email, last_login_city, last_login_country, last_login_at")
    .not("last_login_at", "is", null)
    .order("last_login_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    email: r.email as string,
    city: (r.last_login_city as string | null) ?? null,
    country: (r.last_login_country as string | null) ?? null,
    at: r.last_login_at as string,
  }));
}

export async function getAdminOverview(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AdminOverview> {
  const [
    vendedores,
    deals,
    prospects,
    commissionsPendientes,
    dealsCobrados,
    commissionsPendientesMontos,
    topVendedorRes,
    certificados,
  ] = await Promise.all([
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
    supabase.from("deals").select("monto").eq("estado", "pagado"),
    supabase.from("commissions").select("monto").eq("estado", "pendiente"),
    supabase
      .from("commissions")
      .select("monto, vendedor:users!commissions_vendedor_id_fkey(nombre)"),
    supabase
      .from("certifications")
      .select("user_id", { count: "exact", head: true }),
  ]);

  const ingresosTotalesCobrados = (dealsCobrados.data ?? []).reduce(
    (s, d) => s + Number((d as { monto: number }).monto),
    0
  );

  const ingresosPotencialesPendientes = (commissionsPendientesMontos.data ?? []).reduce(
    (s, c) => s + Number((c as { monto: number }).monto),
    0
  );

  // Agrupar comisiones por vendedor y encontrar el top
  const byVendedor = new Map<string, number>();
  for (const row of (topVendedorRes.data ?? []) as unknown as Array<{
    monto: number;
    vendedor: { nombre: string } | null;
  }>) {
    const nombre = row.vendedor?.nombre ?? "—";
    byVendedor.set(nombre, (byVendedor.get(nombre) ?? 0) + Number(row.monto));
  }
  let topVendedor: { nombre: string; monto: number } | null = null;
  for (const [nombre, monto] of byVendedor.entries()) {
    if (!topVendedor || monto > topVendedor.monto) topVendedor = { nombre, monto };
  }

  const [leaderboardEntrenamiento, leaderboardCertificados] = await Promise.all([
    getLeaderboardEntrenamiento(supabase),
    getLeaderboardCertificados(supabase),
  ]);

  return {
    vendedoresActivos: vendedores.count ?? 0,
    dealsPendientesAprobacion: deals.count ?? 0,
    prospectosSinAsignar: prospects.count ?? 0,
    comisionesPorPagar: commissionsPendientes.count ?? 0,
    ingresosTotalesCobrados,
    ingresosPotencialesPendientes,
    topVendedor,
    certificados: certificados.count ?? 0,
    leaderboardEntrenamiento,
    leaderboardCertificados,
  };
}

export async function getLeaderboardEntrenamiento(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<LeaderEntrenamiento[]> {
  // Vendedores NO certificados con enrollment activo, ordenados por día desc,
  // luego por score promedio de prácticas desc.
  const { data } = await supabase
    .from("users")
    .select(
      "id, nombre, rol, certifications(user_id), enrollments(dia_actual, estado), practice_sessions(score)"
    )
    .eq("rol", "vendedor");

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    nombre: string;
    certifications: { user_id: string } | null;
    enrollments: { dia_actual: number; estado: string } | null;
    practice_sessions: { score: number | null }[];
  }>;

  return rows
    .filter((r) => !r.certifications && r.enrollments?.estado !== "archivado")
    .map((r) => {
      const scores = r.practice_sessions
        .map((s) => s.score)
        .filter((s): s is number => typeof s === "number");
      return {
        id: r.id,
        nombre: r.nombre,
        dia: r.enrollments?.dia_actual ?? 1,
        practicasCompletadas: r.practice_sessions.length,
        scorePromedio:
          scores.length > 0
            ? Math.round(
                (scores.reduce((s, n) => s + n, 0) / scores.length) * 10
              ) / 10
            : null,
      };
    })
    .sort((a, b) => {
      if (b.dia !== a.dia) return b.dia - a.dia;
      const av = a.scorePromedio ?? -1;
      const bv = b.scorePromedio ?? -1;
      if (bv !== av) return bv - av;
      return b.practicasCompletadas - a.practicasCompletadas;
    })
    .slice(0, 5);
}

export async function getLeaderboardCertificados(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<LeaderCertificado[]> {
  // Certificados ordenados por comisión total (pagada + pendiente) desc.
  const { data } = await supabase
    .from("certifications")
    .select(
      "user_id, fecha_certificacion, user:users!certifications_user_id_fkey(nombre), commissions:commissions!commissions_vendedor_id_fkey(monto, deal_id)"
    );

  const rows = (data ?? []) as unknown as Array<{
    user_id: string;
    fecha_certificacion: string;
    user: { nombre: string } | null;
    commissions: { monto: number; deal_id: string }[];
  }>;

  return rows
    .map((r) => ({
      id: r.user_id,
      nombre: r.user?.nombre ?? "—",
      fechaCert: r.fecha_certificacion,
      comisionTotal: r.commissions.reduce((s, c) => s + Number(c.monto), 0),
      ventasCerradas: new Set(r.commissions.map((c) => c.deal_id)).size,
    }))
    .sort((a, b) => b.comisionTotal - a.comisionTotal)
    .slice(0, 5);
}

export function pesos(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
