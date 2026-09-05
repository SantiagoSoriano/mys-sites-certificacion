import { getAdminOverview, getRecentLogins, pesos, requireAdmin } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import StatCard from "../dashboard/StatCard";
import BusinessSeeder from "./BusinessSeeder";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const [data, recentLogins] = await Promise.all([
    getAdminOverview(supabase),
    getRecentLogins(supabase, 8),
  ]);

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Vendedores"
          value={data.vendedoresActivos}
          hint={`${data.certificados} certificados`}
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

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white/60 p-5">
          <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
            Ingresos cobrados
          </p>
          <p className="text-3xl font-semibold text-verde mt-1">
            {pesos(data.ingresosTotalesCobrados)}
          </p>
          <p className="text-xs text-cafe/60 mt-1">Total histórico</p>
        </div>
        <div className="rounded-2xl border border-border bg-white/60 p-5">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Comisiones potenciales
          </p>
          <p className="text-3xl font-semibold text-terracota mt-1">
            {pesos(data.ingresosPotencialesPendientes)}
          </p>
          <p className="text-xs text-cafe/60 mt-1">Aprobadas, sin pagar</p>
        </div>
        <div className="rounded-2xl border border-border bg-white/60 p-5">
          <p className="text-[10px] uppercase tracking-widest text-cafe/60 font-medium">
            Top vendedor
          </p>
          {data.topVendedor ? (
            <>
              <p className="text-xl font-semibold text-cafe mt-1 truncate">
                {data.topVendedor.nombre}
              </p>
              <p className="text-xs text-cafe/70 mt-1">
                {pesos(data.topVendedor.monto)} generado
              </p>
            </>
          ) : (
            <p className="text-sm text-cafe/50 mt-2">Sin ventas aún</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-terracota">
              En entrenamiento
            </h3>
            <span className="text-xs text-cafe/60">
              {data.leaderboardEntrenamiento.length}
            </span>
          </div>
          {data.leaderboardEntrenamiento.length === 0 ? (
            <p className="text-sm text-cafe/60 italic">
              Nadie está haciendo el curso ahora mismo.
            </p>
          ) : (
            <ol className="space-y-2">
              {data.leaderboardEntrenamiento.map((v, i) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      i === 0
                        ? "bg-terracota text-crema"
                        : i === 1
                        ? "bg-cafe/30 text-cafe"
                        : i === 2
                        ? "bg-cafe/15 text-cafe"
                        : "bg-cafe/5 text-cafe/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-cafe font-medium truncate">{v.nombre}</p>
                    <p className="text-[10px] text-cafe/60">
                      Día {v.dia}/8 · {v.practicasCompletadas}{" "}
                      {v.practicasCompletadas === 1 ? "práctica" : "prácticas"}
                    </p>
                  </div>
                  {v.scorePromedio !== null && (
                    <span className="text-xs text-terracota font-semibold">
                      {v.scorePromedio}/10
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="text-[10px] text-cafe/50 italic pt-1">
            Ordenados por día del curso, después por score promedio.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-verde">
              Top vendedores certificados
            </h3>
            <span className="text-xs text-cafe/60">
              {data.leaderboardCertificados.length}
            </span>
          </div>
          {data.leaderboardCertificados.length === 0 ? (
            <p className="text-sm text-cafe/60 italic">
              Todavía nadie está certificado.
            </p>
          ) : (
            <ol className="space-y-2">
              {data.leaderboardCertificados.map((v, i) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      i === 0
                        ? "bg-verde text-crema"
                        : i === 1
                        ? "bg-verde/30 text-verde"
                        : i === 2
                        ? "bg-verde/15 text-verde"
                        : "bg-cafe/5 text-cafe/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-cafe font-medium truncate">{v.nombre}</p>
                    <p className="text-[10px] text-cafe/60">
                      {v.ventasCerradas}{" "}
                      {v.ventasCerradas === 1 ? "venta" : "ventas"} cerradas
                    </p>
                  </div>
                  <span className="text-xs text-verde font-semibold">
                    {pesos(v.comisionTotal)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-[10px] text-cafe/50 italic pt-1">
            Ordenados por comisión total. Al certificarse alguien, sale de
            entrenamiento y entra aquí automáticamente.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-cafe">Últimos accesos</h2>
          <span className="text-[10px] text-cafe/50">
            Ciudad estimada por IP — puede diferir de la ubicación real
          </span>
        </div>
        {recentLogins.length === 0 ? (
          <p className="text-sm text-cafe/60">
            Nadie ha entrado desde que se activó el tracking de geolocation.
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-white/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Ciudad (IP)</th>
                  <th className="px-4 py-3 font-medium">País</th>
                  <th className="px-4 py-3 font-medium">Último ingreso</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="text-cafe font-medium">{r.nombre}</div>
                      <div className="text-xs text-cafe/60">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-cafe/85">
                      {r.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe/85">
                      {r.country ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe/70 text-xs">
                      {dateFmt.format(new Date(r.at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-cafe">Herramientas</h2>
        <BusinessSeeder />
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
