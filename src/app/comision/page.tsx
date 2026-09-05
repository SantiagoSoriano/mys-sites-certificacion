import { requireUser, pesos } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

const PLAN_LABEL: Record<string, string> = {
  temporada: "Temporada",
  negocio: "Negocio",
  completo: "Completo",
};

export default async function ComisionPage() {
  const { supabase, user } = await requireUser();

  const { data: commissions } = await supabase
    .from("commissions")
    .select(
      "id, monto, estado, fecha_pago, created_at, deal:deals(prospect_id, plan, monto, estado, prospect:prospects(negocio))"
    )
    .eq("vendedor_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (commissions ?? []) as unknown as Array<{
    id: string;
    monto: number;
    estado: "pendiente" | "pagado_efectivo";
    fecha_pago: string | null;
    created_at: string;
    deal: {
      prospect_id: string;
      plan: string;
      monto: number;
      estado: string;
      prospect: { negocio: string } | null;
    } | null;
  }>;

  const totalPagado = rows
    .filter((r) => r.estado === "pagado_efectivo")
    .reduce((sum, r) => sum + Number(r.monto), 0);
  const totalPendiente = rows
    .filter((r) => r.estado === "pendiente")
    .reduce((sum, r) => sum + Number(r.monto), 0);

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section>
        <h2 className="text-2xl font-semibold text-cafe">Tu comisión</h2>
        <p className="text-sm text-cafe/70 mt-1">
          20% de cada venta cerrada. Se paga en efectivo una vez aprobado el
          comprobante del cliente.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-terracota/10 border border-border p-5">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Por cobrar
          </p>
          <p className="text-3xl font-semibold text-terracota mt-1">
            {pesos(totalPendiente)}
          </p>
        </div>
        <div className="rounded-2xl bg-verde/10 border border-border p-5">
          <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
            Ya cobrada
          </p>
          <p className="text-3xl font-semibold text-verde mt-1">
            {pesos(totalPagado)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-cafe">Historial</h3>
        {rows.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-white/40 p-10 text-center space-y-2">
            <p className="text-5xl">💰</p>
            <h3 className="text-lg font-semibold text-cafe">
              Todavía sin comisiones
            </h3>
            <p className="text-sm text-cafe/70 max-w-md mx-auto">
              Cuando cierres tu primera venta y se apruebe el pago, aparece
              aquí. Vas por tu primera 20%.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Venta</th>
                  <th className="px-4 py-3 font-medium">Comisión</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 text-cafe/85">
                      {r.deal?.prospect?.negocio ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe/85">
                      {r.deal ? PLAN_LABEL[r.deal.plan] ?? r.deal.plan : "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe/85">
                      {r.deal ? pesos(Number(r.deal.monto)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe font-semibold">
                      {pesos(Number(r.monto))}
                    </td>
                    <td className="px-4 py-3">
                      {r.estado === "pagado_efectivo" ? (
                        <span className="text-xs text-verde font-medium">
                          Pagada {r.fecha_pago ? `· ${dateFmt.format(new Date(r.fecha_pago))}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-terracota font-medium">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
