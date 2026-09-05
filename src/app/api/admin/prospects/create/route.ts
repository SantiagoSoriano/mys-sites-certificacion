import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  negocio?: string;
  contacto_nombre?: string;
  contacto_tel?: string;
  contacto_email?: string;
  giro?: string;
  ciudad?: string;
};

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

  if (!body.negocio || body.negocio.trim().length < 2) {
    return NextResponse.json({ error: "missing_negocio" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prospects")
    .insert({
      negocio: body.negocio.trim(),
      contacto_nombre: body.contacto_nombre?.trim() || null,
      contacto_tel: body.contacto_tel?.trim() || null,
      contacto_email: body.contacto_email?.trim() || null,
      giro: body.giro?.trim() || null,
      ciudad: body.ciudad?.trim() || null,
      estado: "disponible",
    })
    .select("id, negocio")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, prospect: data });
}
