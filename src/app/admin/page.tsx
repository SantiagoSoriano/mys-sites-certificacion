import { getAdminOverview, requireAdmin } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import StatCard from "../dashboard/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const data = await getAdminOverview(supabase);

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Vendedores"
          value={data.vendedoresActivos}
          hint="Cuentas registradas"
          href="/admin/vendedores"
        />
        <StatCard
          label="Pagos por aprobar"
          value={data.dealsPendientesAprobacion}
          hint="SLA 24h"
          accent="terracota"
          href="/admin/deals"
        />
        <StatCard
          label="Prospectos libres"
          value={data.prospectosSinAsignar}
          hint="Listos para asignar"
          href="/admin/prospectos"
        />
        <StatCard
          label="Comisiones por pagar"
          value={data.comisionesPorPagar}
          hint="Efectivo pendiente"
          accent="verde"
          href="/admin/comisiones"
        />
      </section>

      <section className="rounded-2xl border border-border bg-white/40 p-5 text-sm text-cafe/70 space-y-2">
        <p>
          <strong className="text-cafe">Nota:</strong> las 4 subvistas
          (vendedores, deals, prospectos, comisiones) son placeholders por
          ahora. Vienen en el siguiente bloque, junto con la integración al
          Mapa de Prospectos.
        </p>
      </section>
    </main>
  );
}
