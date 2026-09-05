import { getDashboardData, pesos, requireUser } from "@/lib/db/queries";
import { fraseDelDia } from "@/lib/motivation";
import { getPueblaWeather } from "@/lib/weather";
import TopNav from "@/components/TopNav";
import StatCard from "./StatCard";
import ConfettiOnCert from "./ConfettiOnCert";
import FraseCard from "./FraseCard";

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
      <ConfettiOnCert certificado={data.certificado} />
      <TopNav user={user} variant="vendedor" />

      <section className="flex flex-col sm:flex-row gap-3">
        <FraseCard initial={frase} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
        <ExamCard
          dia={enrollment?.dia_actual ?? 1}
          disponible={puedeExamen}
          certificado={data.certificado}
        />
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

    </main>
  );
}

function ExamCard({
  dia,
  disponible,
  certificado,
}: {
  dia: number;
  disponible: boolean;
  certificado: boolean;
}) {
  if (certificado) {
    return (
      <div className="rounded-2xl bg-verde text-crema p-6 sm:p-8 flex items-center gap-6">
        <span className="text-6xl sm:text-7xl" aria-hidden="true">🏆</span>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
            Certificado
          </p>
          <h3 className="text-2xl sm:text-3xl font-semibold mt-1">
            Ya vendes de verdad
          </h3>
          <p className="text-sm opacity-90 mt-1">
            Recibes prospectos, ganas 20% de comisión por cada cliente que cierres.
          </p>
        </div>
      </div>
    );
  }

  if (disponible) {
    return (
      <a
        href="/examen"
        className="block rounded-2xl bg-terracota text-crema p-6 sm:p-8 shadow-lg hover:bg-terracota-oscuro transition group"
      >
        <div className="flex items-center gap-6">
          <span className="text-6xl sm:text-7xl group-hover:scale-110 transition" aria-hidden="true">
            ✨
          </span>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
              Examen disponible
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold mt-1">
              Tu certificación te espera
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Apruébalo con 8 o más en las dos partes y arrancas a vender de verdad.
            </p>
          </div>
          <span className="text-2xl opacity-70 group-hover:translate-x-1 transition" aria-hidden="true">
            →
          </span>
        </div>
      </a>
    );
  }

  const diasFaltan = Math.max(0, 8 - dia);

  return (
    <div className="rounded-2xl bg-cafe text-crema p-6 sm:p-8 flex items-center gap-6 relative overflow-hidden">
      {/* Decorative padlock backdrop */}
      <span
        className="absolute -right-4 -bottom-4 text-[10rem] opacity-5 pointer-events-none"
        aria-hidden="true"
      >
        🔒
      </span>
      <span className="text-6xl sm:text-7xl relative z-10" aria-hidden="true">
        🔒
      </span>
      <div className="flex-1 relative z-10">
        <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
          Examen bloqueado
        </p>
        <h3 className="text-2xl sm:text-3xl font-semibold mt-1">
          Tu meta al día 8
        </h3>
        <p className="text-sm opacity-85 mt-1">
          {diasFaltan > 0
            ? `Te faltan ${diasFaltan} ${diasFaltan === 1 ? "día" : "días"} de práctica para desbloquearlo.`
            : "Estás a nada — mantén el ritmo diario."}{" "}
          Aprobarlo te da la certificación y prospectos reales.
        </p>
      </div>
    </div>
  );
}
