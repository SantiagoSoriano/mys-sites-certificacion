// Types client-safe — usables desde componentes "use client" sin arrastrar
// las funciones que dependen de next/headers.

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
  mostrarGanancias: boolean;
};

export type RecentLogin = {
  id: string;
  nombre: string;
  email: string;
  city: string | null;
  country: string | null;
  at: string;
};

export type DashboardData = {
  enrollment: Enrollment | null;
  practicaHoyCompletada: boolean;
  prospectosActivos: number;
  dealsEnCurso: number;
  comisionPendiente: number;
  comisionPagada: number;
  certificado: boolean;
};

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
