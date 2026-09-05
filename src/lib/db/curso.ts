import type { createClient } from "@/lib/supabase/server";

export type Etapa = "guiado" | "multiple" | "libre";

export type BusinessSim = {
  id: string;
  giro: string;
  nombre_ficticio: string;
  dificultad: "facil" | "dificil";
  personalidad: string;
  objeciones: string[];
  prompt_base: string;
};

export type PracticeSession = {
  id: string;
  dia: number;
  etapa: Etapa;
  score: number | null;
  feedback: string | null;
  created_at: string;
  business: { nombre_ficticio: string; giro: string } | null;
};

/**
 * Given the current day (1-8), returns which stage the student should be in.
 * Days 1-2: guided. Days 2-3: multiple choice. Days 4+: free-form.
 */
export function etapaDelDia(dia: number): Etapa {
  if (dia <= 2) return "guiado";
  if (dia <= 3) return "multiple";
  return "libre";
}

/**
 * Difficulty ramps: días 1-4 fáciles, 5-8 difíciles.
 */
export function dificultadDelDia(dia: number): "facil" | "dificil" {
  return dia <= 4 ? "facil" : "dificil";
}

/**
 * Deterministic business selection: same user + same day + same pool = same
 * business. Rotates through all available businesses of the right difficulty.
 */
export function businessOfDay(
  businesses: BusinessSim[],
  userId: string,
  dia: number
): BusinessSim | null {
  if (businesses.length === 0) return null;
  const seedStr = `${userId}-${dia}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % businesses.length;
  return businesses[idx];
}

export async function getCursoData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const today = new Date().toISOString().slice(0, 10);

  const [enrollmentRes, dailyRes, sessionsRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("dia_actual, estado, ultima_actividad, primera_fecha")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_activity")
      .select("practicas_completadas")
      .eq("user_id", userId)
      .eq("fecha", today)
      .maybeSingle(),
    supabase
      .from("practice_sessions")
      .select("id, dia, etapa, score, feedback, created_at, business:businesses_sim(nombre_ficticio, giro)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const dia = (enrollmentRes.data?.dia_actual as number | undefined) ?? 1;
  const dificultad = dificultadDelDia(dia);

  const { data: businesses } = await supabase
    .from("businesses_sim")
    .select("id, giro, nombre_ficticio, dificultad, personalidad, objeciones, prompt_base")
    .eq("dificultad", dificultad);

  const business = businessOfDay(
    (businesses ?? []) as BusinessSim[],
    userId,
    dia
  );

  return {
    dia,
    etapa: etapaDelDia(dia),
    dificultad,
    estado: (enrollmentRes.data?.estado as string | undefined) ?? "activo",
    business,
    practicasHoy:
      (dailyRes.data?.practicas_completadas as number | undefined) ?? 0,
    sessions: (sessionsRes.data ?? []) as unknown as PracticeSession[],
  };
}
