import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { markMapaProspect, type MapaProspect } from "@/lib/mapa-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS_MAX = 5;

type Body = { negocio?: MapaProspect };

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

  const negocio = body.negocio;
  if (!negocio?.id || !negocio.nombre) {
    return NextResponse.json({ error: "missing_negocio" }, { status: 400 });
  }

  // Verificar cuántos slots activos tiene ya el vendedor
  const { count: activos } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("asignado_a", user.id)
    .in("estado", ["asignado", "en_venta"]);

  if ((activos ?? 0) >= SLOTS_MAX) {
    return NextResponse.json(
      {
        error: "slots_llenos",
        activos: activos ?? 0,
        max: SLOTS_MAX,
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Crear el prospect en la app (estado asignado directo, con el mapa_prospectos_id)
  const { data: created, error: insertErr } = await admin
    .from("prospects")
    .insert({
      negocio: negocio.nombre,
      contacto_tel: negocio.telefono || null,
      giro: negocio.tipos ? negocio.tipos.split(",")[0].trim() : null,
      ciudad: negocio.direccion || null,
      mapa_prospectos_id: negocio.id,
      estado: "asignado",
      asignado_a: user.id,
      asignado_desde: now,
    })
    .select("id, negocio")
    .single();

  if (insertErr || !created) {
    return NextResponse.json(
      { error: insertErr?.message ?? "insert_failed" },
      { status: 500 }
    );
  }

  // Marcar en el Mapa como en_programa. Si falla el mark, revertimos.
  try {
    await markMapaProspect(negocio.id, created.id as string);
  } catch (e: unknown) {
    // Rollback: borrar el prospect que acabamos de crear
    await admin.from("prospects").delete().eq("id", created.id);
    const msg = e instanceof Error ? e.message : "mapa_mark_failed";
    if (msg === "already_claimed_by_someone_else") {
      return NextResponse.json(
        { error: "already_claimed_by_someone_else" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Log del evento
  await admin.from("prospect_events").insert({
    prospect_id: created.id,
    tipo: "asignado",
    notas: "Reclamado del Mapa por el vendedor",
    user_id: user.id,
    ts: now,
  });

  return NextResponse.json({ ok: true, prospect_id: created.id });
}
