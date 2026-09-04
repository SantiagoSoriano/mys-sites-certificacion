import Link from "next/link";
import { getDashboardData, pesos, requireUser } from "@/lib/db/queries";
import SignOutButton from "./sign-out-button";
import StatCard from "./StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const data = await getDashboardData(supabase, user.id);

  const primerNombre = user.nombre.split(" ")[0];
  const enrollment = data.enrollment;
  const puedeExamen = (enrollment?.dia_actual ?? 1) >= 8 && !data.certificado;

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-verde font-medium">
            MyS Sites · Vendedor
          </p>
          <h1 className="text-3xl font-semibold text-cafe mt-1">
            Hola, {primerNombre}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user.rol === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-verde underline underline-offset-4"
            >
              Panel admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

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
