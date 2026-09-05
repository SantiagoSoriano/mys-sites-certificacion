import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listMapaProspects } from "@/lib/mapa-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel default max is 10s en hobby, pero fluid compute permite hasta 60.
// Necesitamos 90+ para el cold start del Mapa.
export const maxDuration = 90;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "500", 10);
  const giro = url.searchParams.get("giro") ?? undefined;
  const ciudad = url.searchParams.get("ciudad") ?? undefined;
  const sinSitioSolo = url.searchParams.get("sin_sitio_solo") === "1";

  try {
    const prospects = await listMapaProspects({
      limit,
      giro,
      ciudad,
      sinSitioSolo,
    });
    return NextResponse.json({ ok: true, prospects });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    const coldStart =
      msg.includes("cold start") ||
      msg.includes("abort") ||
      msg.includes("timeout") ||
      msg.includes("unreachable");
    return NextResponse.json(
      { error: msg, cold_start: coldStart },
      { status: coldStart ? 503 : 500 }
    );
  }
}
