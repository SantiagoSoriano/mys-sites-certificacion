import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { prospect_id?: string; vendedor_id?: string };

export async function POST(request: Request) {
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
  if (profile?.rol !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!body.prospect_id || !body.vendedor_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: updateErr } = await admin
    .from("prospects")
    .update({
      estado: "asignado",
      asignado_a: body.vendedor_id,
      asignado_desde: now,
      ultimo_seguimiento: null,
    })
    .eq("id", body.prospect_id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await admin.from("prospect_events").insert({
    prospect_id: body.prospect_id,
    tipo: "asignado",
    notas: "Asignado por admin",
    user_id: user.id,
    ts: now,
  });

  return NextResponse.json({ ok: true });
}
