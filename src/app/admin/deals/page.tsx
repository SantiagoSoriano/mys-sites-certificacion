import Link from "next/link";
import { requireAdmin, pesos } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  mensaje_inicial_enviado: { label: "Presentado", color: "bg-cafe/10 text-cafe" },
  en_venta: { label: "En venta", color: "bg-terracota/15 text-terracota" },
  listo_pago: { label: "Listo para pago", color: "bg-terracota text-crema" },
  datos_enviados: { label: "Datos enviados", color: "bg-verde/15 text-verde" },
  comprobante_recibido: { label: "Por aprobar", color: "bg-terracota text-crema" },
  aprobado: { label: "Aprobado", color: "bg-verde text-crema" },
  pagado: { label: "Pagado", color: "bg-verde/15 text-verde" },
};

export default async function AdminDealsPage() {
  const { supabase, user } = await requireAdmin();

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "id, plan, monto, estado, created_at, updated_at, vendedor:users!deals_vendedor_id_fkey(nombre, email), prospect:prospects(negocio)"
    )
    .order("updated_at", { ascending: false });

  const rows = (deals ?? []) as unknown as Array<{
    id: string;
    plan: string;
    monto: number;
    estado: string;
    created_at: string;
    updated_at: string;
    vendedor: { nombre: string; email: string } | null;
    prospect: { negocio: string } | null;
  }>;

  const porAprobar = rows.filter((d) => d.estado === "comprobante_recibido");
  const enCurso = rows.filter(
    (d) => !["aprobado", "pagado"].includes(d.estado) && d.estado !== "comprobante_recibido"
  );
  const cerrados = rows.filter((d) => ["aprobado", "pagado"].includes(d.estado));

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <div>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-terracota hover:opacity-80">
          ← Panel admin
        </Link>
        <h2 className="text-2xl font-semibold text-cafe mt-2">Deals</h2>
        <p className="text-sm text-cafe/70 mt-1">
          Cola de deals en flujo. SLA de aprobación: máximo 24h.
        </p>
      </div>

      <DealSection title="Por aprobar" rows={porAprobar} accent="terracota" empty="Nada por aprobar ahora mismo." />
      <DealSection title="En curso" rows={enCurso} accent="cafe" empty="Sin deals activos." />
      <DealSection title="Cerrados" rows={cerrados} accent="verde" empty="Aún sin ventas cerradas." />
    </main>
  );
}

function DealSection({
  title,
  rows,
  accent,
  empty,
}: {
  title: string;
  rows: Array<{
    id: string;
    plan: string;
    monto: number;
    estado: string;
    updated_at: string;
    vendedor: { nombre: string; email: string } | null;
    prospect: { negocio: string } | null;
  }>;
  accent: "terracota" | "cafe" | "verde";
  empty: string;
}) {
  const accentClass =
    accent === "terracota" ? "text-terracota" : accent === "verde" ? "text-verde" : "text-cafe";
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
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const est = ESTADO_LABELS[d.estado] ?? { label: d.estado, color: "bg-cafe/10 text-cafe" };
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-4 py-3 text-cafe/85">{d.prospect?.negocio ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-cafe text-xs">{d.vendedor?.nombre ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-cafe/85 capitalize">{d.plan}</td>
                    <td className="px-4 py-3 text-cafe font-semibold">{pesos(Number(d.monto))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full ${est.color}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-cafe/60">{dateFmt.format(new Date(d.updated_at))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
