import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_TEMPLATES } from "@/lib/business-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  let count = 3;
  try {
    const body = (await request.json()) as { count?: number };
    if (typeof body.count === "number") {
      count = Math.max(1, Math.min(10, Math.floor(body.count)));
    }
  } catch {
    /* keep default */
  }

  // Pick N random templates without replacement (or with, if count > pool)
  const pool = [...BUSINESS_TEMPLATES];
  const chosen: (typeof BUSINESS_TEMPLATES)[number][] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...BUSINESS_TEMPLATES);
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  const rows = chosen.map((tpl) => {
    const dificultad: "facil" | "dificil" = Math.random() < 0.5 ? "facil" : "dificil";
    const nombre = pick(tpl.nombreOptions);
    const personalidad =
      dificultad === "facil" ? tpl.personalidadFacil : tpl.personalidadDificil;
    const objeciones =
      dificultad === "facil" ? tpl.objecionesFacil : tpl.objecionesDificil;
    const prompt = `Eres ${personalidad.split(",")[0].trim()}, dueño(a) de ${nombre} en Puebla. Responde como si estuvieras en WhatsApp, máximo 2-3 oraciones por turno. Nunca rompas personaje.`;

    return {
      giro: tpl.giro,
      nombre_ficticio: nombre,
      dificultad,
      personalidad,
      objeciones,
      prompt_base: prompt,
    };
  });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses_sim")
    .insert(rows)
    .select("id, giro, nombre_ficticio, dificultad");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: data?.length ?? 0, businesses: data });
}
