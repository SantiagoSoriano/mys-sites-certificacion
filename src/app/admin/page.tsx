import Link from "next/link";
import { getAdminOverview, requireAdmin } from "@/lib/db/queries";
import SignOutButton from "../dashboard/sign-out-button";
import StatCard from "../dashboard/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const data = await getAdminOverview(supabase);

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-terracota font-medium">
            MyS Sites · Admin
          </p>
          <h1 className="text-3xl font-semibold text-cafe mt-1">
            Panel de control
          </h1>
          <p className="text-sm text-cafe/60 mt-1">
            {user.nombre} · {user.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-verde underline underline-offset-4"
          >
            Ver como vendedor
          </Link>
          <SignOutButton />
        </div>
      </header>

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
