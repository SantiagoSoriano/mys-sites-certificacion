import { requireUser } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import MapaVendedor from "./MapaVendedor";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const { supabase, user } = await requireUser();

  const { count: activos } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("asignado_a", user.id)
    .in("estado", ["asignado", "en_venta"]);

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

      <MapaVendedor slotsLibres={Math.max(0, 5 - (activos ?? 0))} />
    </main>
  );
}
