import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coachEvaluate, type ChatMessage } from "@/lib/llm";
import { etapaDelDia } from "@/lib/db/curso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  business_id: string;
  history: ChatMessage[];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses_sim")
    .select("nombre_ficticio, giro, dificultad, personalidad, objeciones, prompt_base")
    .eq("id", body.business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "business_not_found" }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("dia_actual")
    .eq("user_id", user.id)
    .maybeSingle();

  const dia = (enrollment?.dia_actual as number | undefined) ?? 1;
  const etapa = etapaDelDia(dia);

  let score = 0;
  let feedback = "";
  try {
    const evalRes = await coachEvaluate(
      business as Parameters<typeof coachEvaluate>[0],
      body.history
    );
    score = evalRes.score;
    feedback = evalRes.feedback;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "coach_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const admin = createAdminClient();

  // Save the practice session
  const { error: sessionErr } = await admin.from("practice_sessions").insert({
    user_id: user.id,
    dia,
    etapa,
    business_id: body.business_id,
    transcripcion: body.history,
    score,
    feedback,
  });
  if (sessionErr) {
    return NextResponse.json({ error: sessionErr.message }, { status: 500 });
  }

  // Increment daily_activity for today
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from("daily_activity")
    .select("practicas_completadas")
    .eq("user_id", user.id)
    .eq("fecha", today)
    .maybeSingle();

  const nextCount = ((existing?.practicas_completadas as number | undefined) ?? 0) + 1;
  await admin.from("daily_activity").upsert({
    user_id: user.id,
    fecha: today,
    practicas_completadas: nextCount,
  });

  // Bump dia_actual + ultima_actividad on the enrollment,
  // capped at 8 and only if this is the first practice of today.
  if (nextCount === 1 && dia < 8) {
    await admin
      .from("enrollments")
      .update({
        dia_actual: dia + 1,
        ultima_actividad: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  } else {
    await admin
      .from("enrollments")
      .update({ ultima_actividad: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true, score, feedback });
}
