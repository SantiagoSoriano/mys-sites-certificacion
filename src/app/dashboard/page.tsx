import { getDashboardData, pesos, requireUser } from "@/lib/db/queries";
import { fraseDelDia } from "@/lib/motivation";
import { getPueblaWeather } from "@/lib/weather";
import TopNav from "@/components/TopNav";
import StatCard from "./StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [data, weather] = await Promise.all([
    getDashboardData(supabase, user.id),
    getPueblaWeather(),
  ]);

  const enrollment = data.enrollment;
  const puedeExamen = (enrollment?.dia_actual ?? 1) >= 8 && !data.certificado;
  const frase = fraseDelDia();

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="vendedor" />

      <section className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 rounded-2xl border border-border bg-terracota/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Frase del día
          </p>
          <p className="text-cafe italic mt-1 leading-snug">
            "{frase}"
          </p>
        </div>
        {weather && (
          <div className="sm:w-52 rounded-2xl border border-border bg-verde/10 px-5 py-4 flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">{weather.emoji}</span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
                Puebla ahora
              </p>
              <p className="text-cafe font-semibold">
                {weather.tempC}°C · {weather.text}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-cafe">Tu curso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Día actual"
            value={enrollment ? `${enrollment.dia_actual} / 8` : "—"}
            hint={
              data.certificado
                ? "Ya estás certificado"
                : enrollment?.estado === "archivado"
                ? "Curso archivado por inactividad"
                : "Debes hacer al menos 1 práctica hoy"
            }
            accent="terracota"
          />
          <StatCard
            label="Práctica de hoy"
            value={data.practicaHoyCompletada ? "Hecha ✓" : "Pendiente"}
            hint={
              data.practicaHoyCompletada
                ? "Cuenta para desbloquear el próximo día"
                : "Sin práctica hoy el día no cuenta"
            }
            accent={data.practicaHoyCompletada ? "verde" : "cafe"}
            href="/curso"
          />
          <StatCard
            label="Examen"
            value={
              data.certificado
                ? "Certificado"
                : puedeExamen
                ? "Disponible"
                : "Bloqueado"
            }
            hint={
              data.certificado
                ? "Puedes vender de verdad"
                : puedeExamen
                ? "Desbloqueado en día 8"
                : "Se abre en el día 8"
            }
            accent={data.certificado ? "verde" : "cafe"}
            href={puedeExamen ? "/examen" : undefined}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-cafe">Tus ventas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Prospectos"
            value={data.prospectosActivos}
            hint="Activos ahora"
            href="/prospectos"
          />
          <StatCard
            label="Deals en curso"
            value={data.dealsEnCurso}
            hint="Sin cerrar aún"
            href="/prospectos"
          />
          <StatCard
            label="Comisión por cobrar"
            value={pesos(data.comisionPendiente)}
            hint="Aprobada, en cola"
            accent="terracota"
            href="/comision"
          />
          <StatCard
            label="Cobrada"
            value={pesos(data.comisionPagada)}
            hint="Total pagado"
            accent="verde"
            href="/comision"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white/40 p-5 text-sm text-cafe/70">
        <p>
          <strong className="text-cafe">Nota:</strong> el simulador de prácticas
          y el examen todavía no están conectados — vienen en el siguiente
          bloque de trabajo. Por ahora los links del curso te llevarán a
          pantallas placeholder.
        </p>
      </section>
    </main>
  );
}
