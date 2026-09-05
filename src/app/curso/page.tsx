import Link from "next/link";
import { requireUser } from "@/lib/db/queries";
import { getAllBusinesses, getCursoData, type Etapa } from "@/lib/db/curso";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const ETAPA_INFO: Record<Etapa, { label: string; sub: string; days: string }> = {
  guiado: {
    label: "Guiado",
    sub: "Cada respuesta viene con guía",
    days: "Días 1-2",
  },
  multiple: {
    label: "Opción múltiple",
    sub: "3 respuestas para elegir",
    days: "Día 3",
  },
  libre: {
    label: "Libre",
    sub: "Escribes tu propia respuesta",
    days: "Días 4-8",
  },
};

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CursoPage() {
  const { supabase, user } = await requireUser();
  const [data, allBusinesses] = await Promise.all([
    getCursoData(supabase, user.id),
    user.rol === "admin"
      ? getAllBusinesses(supabase)
      : Promise.resolve([]),
  ]);

  const practicaHoyHecha = data.practicasHoy > 0;
  const etapaInfo = ETAPA_INFO[data.etapa];

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-cafe">
          Día {data.dia} de 8
        </h2>
        <ProgressBar dia={data.dia} />
        <div className="flex flex-wrap gap-4 text-xs text-cafe/70">
          <span>
            <strong className="text-cafe">Etapa:</strong> {etapaInfo.label} · {etapaInfo.sub}
          </span>
          <span>
            <strong className="text-cafe">Dificultad:</strong>{" "}
            {data.dificultad === "facil" ? "Fácil" : "Difícil"}
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-cafe">Práctica de hoy</h3>

        {!data.business ? (
          <div className="rounded-2xl border border-border bg-white/60 p-5 text-sm text-cafe/70">
            No hay negocios disponibles en el catálogo. Pide a un admin que
            genere unos con el botón en <span className="font-medium">/admin</span>.
          </div>
        ) : practicaHoyHecha ? (
          <div className="rounded-2xl bg-verde text-crema p-6 flex items-start gap-4">
            <span className="text-4xl">✓</span>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
                Ya practicaste hoy
              </p>
              <p className="text-xl font-semibold mt-1">
                {data.practicasHoy}{" "}
                {data.practicasHoy === 1 ? "práctica" : "prácticas"} completada
                {data.practicasHoy === 1 ? "" : "s"}
              </p>
              <p className="text-sm opacity-90 mt-1">
                Puedes hacer más si quieres — solo la primera del día cuenta para
                desbloquear el siguiente.
              </p>
              <Link
                href="/curso/practica"
                className="inline-block mt-4 rounded-full bg-crema text-verde px-5 py-2 text-sm font-medium hover:bg-white transition"
              >
                Practicar otra vez
              </Link>
            </div>
          </div>
        ) : (
          <PracticaCard
            businessNombre={data.business.nombre_ficticio}
            giro={data.business.giro}
            dificultad={data.business.dificultad}
            etapa={data.etapa}
          />
        )}
      </section>

      {user.rol === "admin" && allBusinesses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-terracota">
              Modo admin: prueba cualquier negocio
            </h3>
            <span className="text-xs text-cafe/60">
              {allBusinesses.length} en catálogo
            </span>
          </div>
          <p className="text-xs text-cafe/70">
            Cada card te lleva a una práctica con ese cliente, ignorando el día
            que te toque hoy. Solo tú (admin) ves esta sección.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/curso/practica?business_id=${b.id}`}
                className="group rounded-2xl border border-border bg-white/60 p-4 hover:bg-white/90 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-cafe/60 capitalize">
                    {b.giro}
                  </p>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full ${
                      b.dificultad === "facil"
                        ? "bg-verde/15 text-verde"
                        : "bg-terracota/15 text-terracota"
                    }`}
                  >
                    {b.dificultad}
                  </span>
                </div>
                <p className="text-sm font-semibold text-cafe mt-1 group-hover:text-terracota transition">
                  {b.nombre_ficticio}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-cafe">Etapas del curso</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(ETAPA_INFO) as Etapa[]).map((e) => {
            const info = ETAPA_INFO[e];
            const active = e === data.etapa;
            return (
              <div
                key={e}
                className={`rounded-2xl border p-4 transition ${
                  active
                    ? "border-terracota bg-terracota/10"
                    : "border-border bg-white/40"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-widest font-medium ${
                    active ? "text-terracota" : "text-cafe/50"
                  }`}
                >
                  {info.days}
                </p>
                <p className="text-lg font-semibold text-cafe mt-1">
                  {info.label}
                </p>
                <p className="text-xs text-cafe/70 mt-1">{info.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-cafe">Historial reciente</h3>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-cafe/60">
            Todavía no has terminado ninguna práctica. Empieza con la de hoy.
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-white/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Día</th>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 text-cafe/70 text-xs">
                      {dateFmt.format(new Date(s.created_at))}
                    </td>
                    <td className="px-4 py-3 text-cafe/85">{s.dia}</td>
                    <td className="px-4 py-3 text-cafe/85">
                      {s.business?.nombre_ficticio ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-cafe/85 capitalize">
                      {s.etapa}
                    </td>
                    <td className="px-4 py-3 text-cafe font-semibold">
                      {s.score !== null ? `${s.score}/10` : "—"}
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

function ProgressBar({ dia }: { dia: number }) {
  const pct = Math.min(100, (dia / 8) * 100);
  return (
    <div className="w-full h-3 rounded-full bg-cafe/10 overflow-hidden">
      <div
        className="h-full bg-terracota transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PracticaCard({
  businessNombre,
  giro,
  dificultad,
  etapa,
}: {
  businessNombre: string;
  giro: string;
  dificultad: "facil" | "dificil";
  etapa: Etapa;
}) {
  return (
    <div className="rounded-2xl bg-terracota text-crema p-6 sm:p-8">
      <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
        Tu cliente de hoy
      </p>
      <h4 className="text-3xl font-semibold mt-2">{businessNombre}</h4>
      <p className="text-sm opacity-85 mt-1 capitalize">
        {giro} · {dificultad === "facil" ? "Cliente abierto" : "Cliente exigente"}
      </p>
      <p className="text-sm opacity-90 mt-4 max-w-lg">
        Vas a intentar cerrarle una venta en modo{" "}
        <span className="font-semibold">{ETAPA_INFO[etapa].label.toLowerCase()}</span>.{" "}
        {ETAPA_INFO[etapa].sub.toLowerCase()}.
      </p>
      <Link
        href="/curso/practica"
        className="inline-flex items-center gap-2 mt-6 rounded-full bg-crema text-terracota px-6 py-3 text-sm font-medium hover:bg-white transition"
      >
        Empezar práctica →
      </Link>
    </div>
  );
}
