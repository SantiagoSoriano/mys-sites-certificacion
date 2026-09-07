import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const [{ data: items }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, tipo, titulo, cuerpo, prospect_id, leido, ts")
      .eq("user_id", user.id)
      .order("ts", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("leido", false),
  ]);

  return NextResponse.json({ items: items ?? [], sin_leer: count ?? 0 });
}

// Marca todas como leídas (o solo una si viene ?id=)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  const q = supabase
    .from("notifications")
    .update({ leido: true })
    .eq("user_id", user.id)
    .eq("leido", false);

  const { error } = id ? await q.eq("id", id) : await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
