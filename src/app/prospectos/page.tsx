import Link from "next/link";
import { requireUser } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  asignado: { label: "Asignado", color: "bg-cafe/10 text-cafe" },
  en_venta: { label: "En venta", color: "bg-terracota/15 text-terracota" },
  cerrado_venta: { label: "Cerrado ✓", color: "bg-verde/15 text-verde" },
  cerrado_sin_venta: {
    label: "Cerrado sin venta",
    color: "bg-cafe/10 text-cafe/70",
  },
};

export default async function ProspectosPage() {
  const { supabase, user } = await requireUser();

  const { data: prospects } = await supabase
    .from("prospects")
    .select(
      "id, negocio, contacto_nombre, contacto_tel, giro, ciudad, estado, asignado_desde, ultimo_seguimiento"
    )
    .eq("asignado_a", user.id)
    .order("asignado_desde", { ascending: false });

  const rows = prospects ?? [];

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section>
        <h2 className="text-2xl font-semibold text-cafe">Tus prospectos</h2>
        <p className="text-sm text-cafe/70 mt-1">
          Máximo 3-5 activos a la vez. Si no reportas seguimiento en 7-10 días,
          el prospecto se libera y se le asigna a otro vendedor.
        </p>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white/40 p-10 text-center space-y-2">
          <p className="text-5xl">🌱</p>
          <h3 className="text-xl font-semibold text-cafe">
            Todavía no tienes prospectos asignados
          </h3>
          <p className="text-sm text-cafe/70 max-w-md mx-auto">
            Los prospectos se te asignan cuando estés certificado. Termina
            primero el curso y aprueba el examen.
          </p>
          <Link
            href="/curso"
            className="inline-block mt-3 text-sm text-verde underline"
          >
            Ir al curso →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const est = ESTADO_LABELS[p.estado as string] ?? {
              label: p.estado,
              color: "bg-cafe/10 text-cafe",
            };
            return (
              <div
                key={p.id as string}
                className="rounded-2xl border border-border bg-white/60 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-cafe">
                      {p.negocio}
                    </h3>
                    <p className="text-xs text-cafe/60 mt-0.5">
                      {p.giro && <span className="capitalize">{p.giro}</span>}
                      {p.giro && p.ciudad && " · "}
                      {p.ciudad}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-medium px-3 py-1 rounded-full ${est.color}`}
                  >
                    {est.label}
                  </span>
                </div>

                {p.contacto_nombre && (
                  <p className="text-sm text-cafe/85">
                    <strong className="text-cafe">Contacto:</strong>{" "}
                    {p.contacto_nombre as string}
                    {p.contacto_tel ? ` · ${p.contacto_tel}` : ""}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-cafe/60 pt-2 border-t border-border">
                  <span>
                    Asignado:{" "}
                    {p.asignado_desde
                      ? dateFmt.format(new Date(p.asignado_desde as string))
                      : "—"}
                  </span>
                  <span>
                    Último seguimiento:{" "}
                    {p.ultimo_seguimiento
                      ? dateFmt.format(
                          new Date(p.ultimo_seguimiento as string)
                        )
                      : "sin registrar"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button className="text-xs rounded-full bg-verde text-crema px-4 py-1.5 hover:bg-verde/90 transition">
                    Reportar seguimiento
                  </button>
                  <button className="text-xs rounded-full bg-terracota text-crema px-4 py-1.5 hover:bg-terracota-oscuro transition">
                    Cliente listo para pagar
                  </button>
                  <button className="text-xs rounded-full border border-border text-cafe px-4 py-1.5 hover:bg-white/60 transition">
                    Cerrado sin venta
                  </button>
                </div>
                <p className="text-[10px] text-cafe/40 italic">
                  Acciones aún no conectadas — vienen con el flujo de deals.
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
