import { requireUser } from "@/lib/db/queries";
import { listMapaProspects } from "@/lib/mapa-client";
import TopNav from "@/components/TopNav";
import MapaVendedor from "./MapaVendedor";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const { supabase, user } = await requireUser();

  // Contar slots activos del vendedor
  const { count: activos } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("asignado_a", user.id)
    .in("estado", ["asignado", "en_venta"]);

  let prospects: Awaited<ReturnType<typeof listMapaProspects>> = [];
  let mapaError: string | null = null;
  try {
    prospects = await listMapaProspects({ limit: 500 });
  } catch (e: unknown) {
    mapaError = e instanceof Error ? e.message : "Error cargando Mapa";
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full space-y-6">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section>
        <h2 className="text-2xl font-semibold text-cafe">
          Mapa de prospectos
        </h2>
        <p className="text-sm text-cafe/70 mt-1">
          Negocios reales de Puebla que aún nadie ha reclamado. Click en cualquiera
          para verlo, y si te llama la atención lo reclamas — usa uno de tus 5 slots.
        </p>
      </section>

      <div className="rounded-2xl bg-terracota/10 border border-border px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Tus slots
          </p>
          <p className="text-cafe font-semibold">
            {activos ?? 0} / 5 activos
          </p>
        </div>
        <p className="text-xs text-cafe/60 text-right max-w-xs">
          Solo puedes tener 5 prospectos activos a la vez. Cierra alguno (sí o no)
          para liberar slot.
        </p>
      </div>

      {mapaError ? (
        <div className="rounded-2xl border border-border bg-white/60 p-6 space-y-3 text-sm">
          <p className="font-medium text-terracota-oscuro">
            No se pudo conectar al Mapa.
          </p>
          <p className="text-cafe/70 text-xs">{mapaError}</p>
          {mapaError.includes("cold start") || mapaError.includes("timeout") ? (
            <div className="rounded-lg bg-terracota/10 p-3 space-y-2">
              <p className="text-xs text-cafe">
                <strong>El Mapa estaba dormido</strong> (Render duerme el free
                tier tras 15 min sin uso). Ya lo estamos despertando — refresca
                esta página en <strong>30-60 segundos</strong>.
              </p>
              <a
                href="/mapa"
                className="inline-block text-xs bg-terracota text-crema px-4 py-1.5 rounded-full font-medium hover:bg-terracota-oscuro transition"
              >
                Refrescar ahora
              </a>
            </div>
          ) : (
            <p className="text-xs text-cafe/60">
              Verifica que las env vars{" "}
              <code className="bg-cafe/10 px-1 rounded">MAPA_PROSPECTOS_API_URL</code>{" "}
              y{" "}
              <code className="bg-cafe/10 px-1 rounded">MAPA_PROSPECTOS_API_KEY</code>{" "}
              estén configuradas en Vercel y que el Mapa esté online.
            </p>
          )}
        </div>
      ) : (
        <MapaVendedor
          prospects={prospects}
          slotsLibres={Math.max(0, 5 - (activos ?? 0))}
        />
      )}
    </main>
  );
}
