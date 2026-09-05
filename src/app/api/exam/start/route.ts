import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickRandom } from "@/lib/exam-questions";
import { getAllBusinesses } from "@/lib/db/curso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NUM_PREGUNTAS_TEORICAS = 6;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.rol === "admin";

  // Validate: admin siempre puede; vendedor solo si día >= 8 y no certificado
  if (!isAdmin) {
    const [{ data: enrollment }, { data: cert }, { data: lastAttempt }] =
      await Promise.all([
        supabase
          .from("enrollments")
          .select("dia_actual")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("certifications").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("exam_attempts")
          .select("proximo_intento_ts")
          .eq("user_id", user.id)
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    if (cert) return NextResponse.json({ error: "already_certified" }, { status: 400 });
    const dia = (enrollment?.dia_actual as number | undefined) ?? 1;
    if (dia < 8) return NextResponse.json({ error: "day_locked", dia }, { status: 400 });
    if (
      lastAttempt?.proximo_intento_ts &&
      new Date(lastAttempt.proximo_intento_ts as string) > new Date()
    ) {
      return NextResponse.json(
        { error: "cooldown", until: lastAttempt.proximo_intento_ts },
        { status: 400 }
      );
    }
  }

  const preguntas = pickRandom(NUM_PREGUNTAS_TEORICAS).map((p) => ({
    id: p.id,
    pregunta: p.pregunta,
  }));

  const businesses = await getAllBusinesses(supabase);
  const dificiles = businesses.filter((b) => b.dificultad === "dificil");
  const clientePractico =
    dificiles.length > 0
      ? dificiles[Math.floor(Math.random() * dificiles.length)]
      : businesses[Math.floor(Math.random() * businesses.length)];

  if (!clientePractico) {
    return NextResponse.json(
      { error: "no_businesses_available" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    preguntas,
    clientePractico: {
      id: clientePractico.id,
      nombre_ficticio: clientePractico.nombre_ficticio,
      giro: clientePractico.giro,
      dificultad: clientePractico.dificultad,
      personalidad: clientePractico.personalidad,
    },
  });
}
