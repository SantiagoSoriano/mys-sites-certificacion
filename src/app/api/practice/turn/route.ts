import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithClient, type ChatMessage } from "@/lib/gemini";
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

  if (!body.business_id || !Array.isArray(body.history)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
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

  try {
    const turn = await chatWithClient(
      business as Parameters<typeof chatWithClient>[0],
      body.history,
      etapa
    );
    return NextResponse.json({ ok: true, turn, etapa });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "gemini_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
