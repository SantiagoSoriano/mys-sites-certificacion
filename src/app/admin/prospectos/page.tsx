import Link from "next/link";
import { requireAdmin } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "short" });

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  disponible: { label: "Libre", color: "bg-verde/15 text-verde" },
  asignado: { label: "Asignado", color: "bg-cafe/10 text-cafe" },
  en_venta: { label: "En venta", color: "bg-terracota/15 text-terracota" },
  cerrado_venta: { label: "Cerrado ✓", color: "bg-verde text-crema" },
  cerrado_sin_venta: { label: "Cerrado sin venta", color: "bg-cafe/10 text-cafe/70" },
  liberado: { label: "Liberado", color: "bg-verde/15 text-verde" },
};

export default async function AdminProspectosPage() {
  const { supabase, user } = await requireAdmin();

  const { data: prospects } = await supabase
    .from("prospects")
    .select(
      "id, negocio, giro, ciudad, contacto_nombre, contacto_tel, estado, asignado_desde, ultimo_seguimiento, vendedor:users!prospects_asignado_a_fkey(nombre)"
    )
    .order("created_at", { ascending: false });

  const rows = (prospects ?? []) as unknown as Array<{
    id: string;
    negocio: string;
    giro: string | null;
    ciudad: string | null;
    contacto_nombre: string | null;
    contacto_tel: string | null;
    estado: string;
    asignado_desde: string | null;
    ultimo_seguimiento: string | null;
    vendedor: { nombre: string } | null;
  }>;

  const libres = rows.filter((p) => ["disponible", "liberado"].includes(p.estado));
  const asignados = rows.filter((p) => ["asignado", "en_venta"].includes(p.estado));
  const cerrados = rows.filter((p) => p.estado.startsWith("cerrado"));

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <div>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-terracota hover:opacity-80">
          ← Panel admin
        </Link>
        <h2 className="text-2xl font-semibold text-cafe mt-2">Prospectos</h2>
        <p className="text-sm text-cafe/70 mt-1">
          {rows.length} en total. La integración con el Mapa (Flask/Turso) vendrá en el siguiente bloque.
        </p>
      </div>

      <Section title="Libres" rows={libres} accent="verde" empty="No hay prospectos libres para asignar." />
      <Section title="Asignados / en venta" rows={asignados} accent="terracota" empty="Sin prospectos activos." />
      <Section title="Cerrados" rows={cerrados} accent="cafe" empty="Aún sin cierres." />
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
    negocio: string;
    giro: string | null;
    ciudad: string | null;
    contacto_nombre: string | null;
    estado: string;
    asignado_desde: string | null;
    ultimo_seguimiento: string | null;
    vendedor: { nombre: string } | null;
  }>;
  accent: "verde" | "terracota" | "cafe";
  empty: string;
}) {
  const accentClass =
    accent === "verde" ? "text-verde" : accent === "terracota" ? "text-terracota" : "text-cafe";
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
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Giro</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Últ. seg.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const est = ESTADO_LABELS[p.estado] ?? { label: p.estado, color: "bg-cafe/10 text-cafe" };
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="text-cafe font-medium">{p.negocio}</div>
                      {p.contacto_nombre && (
                        <div className="text-[10px] text-cafe/60">{p.contacto_nombre}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-cafe/85 capitalize">{p.giro ?? "—"}</td>
                    <td className="px-4 py-3 text-cafe/85">{p.ciudad ?? "—"}</td>
                    <td className="px-4 py-3 text-cafe/85">{p.vendedor?.nombre ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full ${est.color}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-cafe/60">
                      {p.ultimo_seguimiento ? dateFmt.format(new Date(p.ultimo_seguimiento)) : "—"}
                    </td>
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
