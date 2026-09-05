import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { user_id?: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const targetId = body.user_id;
  if (!targetId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "cannot_delete_self" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify target is not another admin (safety)
  const { data: target } = await admin
    .from("users")
    .select("rol, nombre")
    .eq("id", targetId)
    .single();

  if (!target) {
    return NextResponse.json({ error: "target_not_found" }, { status: 404 });
  }

  if (target.rol === "admin") {
    return NextResponse.json(
      { error: "cannot_delete_admin" },
      { status: 400 }
    );
  }

  // Delete from auth.users — cascades to public.users via FK ON DELETE CASCADE,
  // which cascades to enrollments, daily_activity, practice_sessions, etc.
  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: target.nombre });
}
