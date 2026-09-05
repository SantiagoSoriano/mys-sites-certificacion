import Link from "next/link";
import { requireAdmin, pesos } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminComisionesPage() {
  const { supabase, user } = await requireAdmin();

  const { data: commissions } = await supabase
    .from("commissions")
    .select(
      "id, monto, estado, fecha_pago, created_at, vendedor:users!commissions_vendedor_id_fkey(nombre, email), deal:deals(plan, monto, prospect:prospects(negocio))"
    )
    .order("created_at", { ascending: false });

  const rows = (commissions ?? []) as unknown as Array<{
    id: string;
    monto: number;
    estado: "pendiente" | "pagado_efectivo";
    fecha_pago: string | null;
    created_at: string;
    vendedor: { nombre: string; email: string } | null;
    deal: { plan: string; monto: number; prospect: { negocio: string } | null } | null;
  }>;

  const pendientes = rows.filter((r) => r.estado === "pendiente");
  const pagadas = rows.filter((r) => r.estado === "pagado_efectivo");

  const totalPendiente = pendientes.reduce((s, r) => s + Number(r.monto), 0);
  const totalPagado = pagadas.reduce((s, r) => s + Number(r.monto), 0);

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <div>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-terracota hover:opacity-80">
          ← Panel admin
        </Link>
        <h2 className="text-2xl font-semibold text-cafe mt-2">Comisiones</h2>
        <p className="text-sm text-cafe/70 mt-1">
          Se pagan en efectivo. La acción &quot;Marcar pagada&quot; llegará con el flujo de deals.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-terracota/10 border border-border p-5">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Por pagar
          </p>
          <p className="text-3xl font-semibold text-terracota mt-1">{pesos(totalPendiente)}</p>
          <p className="text-xs text-cafe/60 mt-1">{pendientes.length} pendientes</p>
        </div>
        <div className="rounded-2xl bg-verde/10 border border-border p-5">
          <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
            Total pagado
          </p>
          <p className="text-3xl font-semibold text-verde mt-1">{pesos(totalPagado)}</p>
          <p className="text-xs text-cafe/60 mt-1">{pagadas.length} entregadas</p>
        </div>
      </section>

      <Section title="Pendientes de pago" rows={pendientes} accent="terracota" empty="Nada por pagar ahora." />
      <Section title="Historial de pagos" rows={pagadas} accent="verde" empty="Sin pagos aún." />
    </main>
  );
}

function Section({
  title,
  rows,
  accent,
  empty,
}: {
  title: string;
  rows: Array<{
    id: string;
    monto: number;
    estado: string;
    fecha_pago: string | null;
    created_at: string;
    vendedor: { nombre: string; email: string } | null;
    deal: { plan: string; monto: number; prospect: { negocio: string } | null } | null;
  }>;
  accent: "terracota" | "verde";
  empty: string;
}) {
  const accentClass = accent === "terracota" ? "text-terracota" : "text-verde";
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className={`text-lg font-semibold ${accentClass}`}>{title}</h3>
        <span className="text-xs text-cafe/60">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-cafe/60 italic">{empty}</p>
      ) : (
        <div className="rounded-2xl border border-border bg-white/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
              <tr>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Venta</th>
                <th className="px-4 py-3 font-medium">Comisión</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="text-cafe text-xs font-medium">{r.vendedor?.nombre ?? "—"}</div>
                    <div className="text-[10px] text-cafe/60">{r.vendedor?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-cafe/85">{r.deal?.prospect?.negocio ?? "—"}</td>
                  <td className="px-4 py-3 text-cafe/85 capitalize">{r.deal?.plan ?? "—"}</td>
                  <td className="px-4 py-3 text-cafe/85">
                    {r.deal ? pesos(Number(r.deal.monto)) : "—"}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${accentClass}`}>
                    {pesos(Number(r.monto))}
                  </td>
                  <td className="px-4 py-3 text-xs text-cafe/60">
                    {r.estado === "pagado_efectivo" && r.fecha_pago
                      ? dateFmt.format(new Date(r.fecha_pago))
                      : dateFmt.format(new Date(r.created_at))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
