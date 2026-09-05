import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "certify" | "uncertify" | "advance_day" | "reset_day" | "archive";

type Body = { user_id?: string; action?: Action };

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

  const { user_id: targetId, action } = body;
  if (!targetId || !action) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "certify") {
    await admin.from("certifications").upsert({ user_id: targetId });
    await admin
      .from("enrollments")
      .update({ estado: "certificado" })
      .eq("user_id", targetId);
    return NextResponse.json({ ok: true, action });
  }

  if (action === "uncertify") {
    await admin.from("certifications").delete().eq("user_id", targetId);
    await admin
      .from("enrollments")
      .update({ estado: "activo" })
      .eq("user_id", targetId);
    return NextResponse.json({ ok: true, action });
  }

  if (action === "advance_day") {
    const { data: e } = await admin
      .from("enrollments")
      .select("dia_actual")
      .eq("user_id", targetId)
      .single();
    const newDia = Math.min(8, ((e?.dia_actual as number) ?? 1) + 1);
    await admin
      .from("enrollments")
      .update({ dia_actual: newDia, ultima_actividad: new Date().toISOString() })
      .eq("user_id", targetId);
    return NextResponse.json({ ok: true, action, dia_actual: newDia });
  }

  if (action === "reset_day") {
    await admin
      .from("enrollments")
      .update({
        dia_actual: 1,
        estado: "activo",
        primera_fecha: new Date().toISOString().slice(0, 10),
        ultima_actividad: new Date().toISOString(),
      })
      .eq("user_id", targetId);
    // También borrar daily_activity para que hoy no cuente ya como practicado
    await admin.from("daily_activity").delete().eq("user_id", targetId);
    return NextResponse.json({ ok: true, action });
  }

  if (action === "archive") {
    await admin
      .from("enrollments")
      .update({ estado: "archivado" })
      .eq("user_id", targetId);
    return NextResponse.json({ ok: true, action });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
