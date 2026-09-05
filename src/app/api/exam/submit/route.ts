import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREGUNTAS_TEORICAS } from "@/lib/exam-questions";
import { coachEvaluate, coachEvaluateTheory, type ChatMessage } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  respuestasTeoricas: { id: string; respuesta: string }[];
  practica: {
    business_id: string;
    history: ChatMessage[];
  };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!body.respuestasTeoricas || !body.practica) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Build theory answers with keys
  const preguntasMap = new Map(PREGUNTAS_TEORICAS.map((p) => [p.id, p]));
  const answers = body.respuestasTeoricas
    .map((r) => {
      const p = preguntasMap.get(r.id);
      if (!p) return null;
      return { pregunta: p.pregunta, clave: p.clave, respuesta: r.respuesta };
    })
    .filter((x): x is { pregunta: string; clave: string; respuesta: string } => !!x);

  // Load practice business
  const { data: business } = await supabase
    .from("businesses_sim")
    .select("nombre_ficticio, giro, dificultad, personalidad, objeciones, prompt_base")
    .eq("id", body.practica.business_id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "business_not_found" }, { status: 404 });
  }

  // Evaluar ambas partes en paralelo
  let theory, practice;
  try {
    [theory, practice] = await Promise.all([
      coachEvaluateTheory(answers),
      coachEvaluate(
        business as Parameters<typeof coachEvaluate>[0],
        body.practica.history
      ),
    ]);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "coach_error" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const aprobado = theory.score >= 8 && practice.score >= 8;

  // Guardar exam_attempt
  await admin.from("exam_attempts").insert({
    user_id: user.id,
    fecha: new Date().toISOString(),
    score_teorico: theory.score,
    score_practico: practice.score,
    transcripcion_teorico: answers,
    transcripcion_practico: body.practica.history,
    proximo_intento_ts: aprobado
      ? new Date().toISOString()
      : new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  });

  // Si aprobó, marcar certificado
  if (aprobado) {
    await admin.from("certifications").upsert({ user_id: user.id });
    await admin
      .from("enrollments")
      .update({ estado: "certificado" })
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    ok: true,
    aprobado,
    theory,
    practice,
  });
}
