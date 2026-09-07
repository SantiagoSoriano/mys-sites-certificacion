import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listMapaProspects, markMapaProspect } from "@/lib/mapa-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SLOTS_MAX = 5;

// Cron semanal (Vercel Cron, domingos 9am Puebla / 15:00 UTC).
// Para cada vendedor certificado, rellena sus slots hasta 5 tomando negocios
// del pool del Mapa. Falla en silencio prospecto por prospecto si el Mapa
// rechaza (409 = alguien más lo tomó primero).
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  // Vercel Cron manda Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Vendedores certificados
  const { data: certificados, error: e1 } = await admin
    .from("enrollments")
    .select("user_id")
    .eq("estado", "certificado");
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (!certificados || certificados.length === 0) {
    return NextResponse.json({ ok: true, procesados: 0, asignados: 0 });
  }

  // Pool del Mapa (uno solo por corrida — evitar cold-start en loop)
  let pool;
  try {
    pool = await listMapaProspects({ limit: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "mapa_unreachable";
    return NextResponse.json({ error: `mapa: ${msg}` }, { status: 502 });
  }

  const now = new Date().toISOString();
  let totalAsignados = 0;
  const detalle: Array<{ user_id: string; asignados: number }> = [];

  for (const { user_id } of certificados) {
    const { count } = await admin
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("asignado_a", user_id)
      .in("estado", ["asignado", "en_venta"]);
    const activos = count ?? 0;
    const faltan = SLOTS_MAX - activos;
    if (faltan <= 0) {
      detalle.push({ user_id, asignados: 0 });
      continue;
    }

    let asignados = 0;
    while (asignados < faltan && pool.length > 0) {
      const negocio = pool.shift()!;
      // Insert local
      const { data: created, error: insErr } = await admin
        .from("prospects")
        .insert({
          negocio: negocio.nombre,
          contacto_tel: negocio.telefono || null,
          giro: negocio.tipos ? negocio.tipos.split(",")[0].trim() : null,
          ciudad: negocio.direccion || null,
          mapa_prospectos_id: negocio.id,
          estado: "asignado",
          asignado_a: user_id,
          asignado_desde: now,
        })
        .select("id")
        .single();
      if (insErr || !created) continue;

      // Reservar en el Mapa
      try {
        await markMapaProspect(negocio.id, created.id as string);
      } catch {
        // Rollback si el Mapa lo rechaza (409 o similar)
        await admin.from("prospects").delete().eq("id", created.id);
        continue;
      }

      await admin.from("prospect_events").insert({
        prospect_id: created.id,
        tipo: "asignado",
        notas: "Auto-asignado por cron semanal",
        user_id: user_id,
        ts: now,
      });
      await admin.from("notifications").insert({
        user_id,
        tipo: "nuevo_asignado",
        titulo: "Nuevo prospecto asignado",
        cuerpo: negocio.nombre,
        prospect_id: created.id,
        ts: now,
      });
      asignados++;
      totalAsignados++;
    }
    detalle.push({ user_id, asignados });

    if (pool.length === 0) break; // pool vacío, no seguir
  }

  return NextResponse.json({
    ok: true,
    procesados: certificados.length,
    asignados: totalAsignados,
    pool_restante: pool.length,
    detalle,
  });
}
