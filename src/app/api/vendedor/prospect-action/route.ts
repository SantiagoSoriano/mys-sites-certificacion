import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseMapaProspect } from "@/lib/mapa-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "seguimiento" | "listo_pago" | "cerrado_sin_venta";

type Body = {
  prospect_id?: string;
  action?: Action;
  notas?: string;
  plan?: "temporada" | "negocio" | "completo";
};

const PLAN_MONTOS: Record<string, number> = {
  temporada: 2000,
  negocio: 4500,
  completo: 12000,
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

  if (!body.prospect_id || !body.action) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Verificar que el prospect esté asignado a este vendedor
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, estado, asignado_a, mapa_prospectos_id")
    .eq("id", body.prospect_id)
    .maybeSingle();

  if (!prospect) return NextResponse.json({ error: "prospect_not_found" }, { status: 404 });
  if (prospect.asignado_a !== user.id) {
    return NextResponse.json({ error: "not_assigned_to_you" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (body.action === "seguimiento") {
    await admin
      .from("prospects")
      .update({ ultimo_seguimiento: now, estado: "en_venta" })
      .eq("id", body.prospect_id);
    await admin.from("prospect_events").insert({
      prospect_id: body.prospect_id,
      tipo: "seguimiento",
      notas: body.notas ?? "Seguimiento reportado",
      user_id: user.id,
      ts: now,
    });
    return NextResponse.json({ ok: true, action: "seguimiento" });
  }

  if (body.action === "cerrado_sin_venta") {
    await admin
      .from("prospects")
      .update({
        estado: "cerrado_sin_venta",
        ultimo_seguimiento: now,
      })
      .eq("id", body.prospect_id);
    await admin.from("prospect_events").insert({
      prospect_id: body.prospect_id,
      tipo: "cerrado_sin_venta",
      notas: body.notas ?? "Cliente no interesado",
      user_id: user.id,
      ts: now,
    });
    // Liberar en el Mapa para que otro vendedor lo pueda tomar.
    // Falla en silencio si el Mapa está dormido o inaccesible — el estado local ya está guardado.
    if (prospect.mapa_prospectos_id) {
      try {
        await releaseMapaProspect(prospect.mapa_prospectos_id);
      } catch (e) {
        console.warn("[prospect-action] release al Mapa falló:", e);
      }
    }
    return NextResponse.json({ ok: true, action: "cerrado_sin_venta" });
  }

  if (body.action === "listo_pago") {
    if (!body.plan || !PLAN_MONTOS[body.plan]) {
      return NextResponse.json({ error: "missing_or_invalid_plan" }, { status: 400 });
    }

    // Crear el deal (estado inicial: listo_pago)
    // Nota: INSERT no dispara el trigger anti-fraude (solo BEFORE UPDATE),
    // pero el estado inicial permitido es mensaje_inicial_enviado o en_venta o listo_pago.
    const { data: deal, error: dealErr } = await admin
      .from("deals")
      .insert({
        prospect_id: body.prospect_id,
        vendedor_id: user.id,
        plan: body.plan,
        monto: PLAN_MONTOS[body.plan],
        estado: "listo_pago",
      })
      .select("id")
      .single();
    if (dealErr) return NextResponse.json({ error: dealErr.message }, { status: 500 });

    // Update prospect: aún asignado, en venta
    await admin
      .from("prospects")
      .update({ estado: "en_venta", ultimo_seguimiento: now })
      .eq("id", body.prospect_id);

    await admin.from("prospect_events").insert({
      prospect_id: body.prospect_id,
      tipo: "listo_pago",
      notas: body.notas ?? `Cliente listo — plan ${body.plan}`,
      user_id: user.id,
      ts: now,
    });

    return NextResponse.json({ ok: true, action: "listo_pago", deal_id: deal.id });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
