import Link from "next/link";
import { requireUser } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function ExamenPage() {
  const { supabase, user } = await requireUser();

  const [enrollmentRes, certRes, lastAttemptRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("dia_actual, estado")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("certifications")
      .select("fecha_certificacion")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("exam_attempts")
      .select("id, fecha, score_teorico, score_practico, aprobado, proximo_intento_ts")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const dia = (enrollmentRes.data?.dia_actual as number | undefined) ?? 1;
  const certificado = !!certRes.data;
  const puedeExamen = dia >= 8 && !certificado;
  const lastAttempt = lastAttemptRes.data;
  const proximoIntento =
    lastAttempt?.proximo_intento_ts && new Date(lastAttempt.proximo_intento_ts as string) > new Date()
      ? new Date(lastAttempt.proximo_intento_ts as string)
      : null;

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section>
        <h2 className="text-2xl font-semibold text-cafe">Examen de certificación</h2>
        <p className="text-sm text-cafe/70 mt-1">
          Dos partes — teórica y práctica. Necesitas 8 o más en cada una para
          certificarte y arrancar a vender de verdad.
        </p>
      </section>

      {certificado ? (
        <div className="rounded-2xl bg-verde text-crema p-6 sm:p-8 flex items-center gap-6">
          <span className="text-6xl" aria-hidden="true">🏆</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
              Certificado
            </p>
            <h3 className="text-2xl font-semibold mt-1">Ya vendes de verdad</h3>
            <p className="text-sm opacity-90 mt-1">
              Certificado el{" "}
              {dateFmt.format(new Date(certRes.data!.fecha_certificacion as string))}.
            </p>
          </div>
        </div>
      ) : proximoIntento ? (
        <div className="rounded-2xl bg-cafe text-crema p-6 sm:p-8 space-y-2">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
            En espera
          </p>
          <h3 className="text-2xl font-semibold">
            Puedes reintentar el{" "}
            {dateFmt.format(proximoIntento)}
          </h3>
          <p className="text-sm opacity-85">
            Solo 1 intento cada 12 horas — así el examen no se puede &quot;adivinar&quot;
            a base de spam.
          </p>
        </div>
      ) : puedeExamen ? (
        <div className="rounded-2xl bg-terracota text-crema p-6 sm:p-8 space-y-3">
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
            Disponible ahora
          </p>
          <h3 className="text-2xl font-semibold">
            Estás listo para tu certificación
          </h3>
          <p className="text-sm opacity-90 max-w-lg">
            El examen se divide en 2 partes seguidas. Aprobar te da comisión
            real por cada venta que cierres.
          </p>
          <button
            disabled
            className="rounded-full bg-crema text-terracota px-6 py-3 text-sm font-medium mt-2 disabled:opacity-70"
          >
            Empezar (esperando IA)
          </button>
          <p className="text-[10px] opacity-70">
            El examen usa el mismo motor de IA que el simulador — se enciende
            en cuanto Santiago pase la API key.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-cafe text-crema p-6 sm:p-8 flex items-center gap-6 relative overflow-hidden">
          <span
            className="absolute -right-4 -bottom-4 text-[10rem] opacity-5 pointer-events-none"
            aria-hidden="true"
          >
            🔒
          </span>
          <span className="text-6xl relative z-10">🔒</span>
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
              Bloqueado
            </p>
            <h3 className="text-2xl font-semibold mt-1">Se abre en el día 8</h3>
            <p className="text-sm opacity-85 mt-1">
              Vas en el día {dia}. Te faltan {Math.max(0, 8 - dia)}{" "}
              {8 - dia === 1 ? "día" : "días"} de práctica diaria para
              desbloquearlo.
            </p>
            <Link
              href="/curso"
              className="inline-block mt-4 text-xs text-crema underline underline-offset-4"
            >
              Ir al curso
            </Link>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
            Parte 1 — Teórica
          </p>
          <h4 className="font-semibold text-cafe">Conocimiento del programa</h4>
          <p className="text-sm text-cafe/75">
            8-10 preguntas sobre los planes, precios, comisión y el protocolo
            anti-fraude del pago. Se evalúan con un coach de IA.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Parte 2 — Práctica
          </p>
          <h4 className="font-semibold text-cafe">Venta simulada larga</h4>
          <p className="text-sm text-cafe/75">
            Una conversación completa con un cliente difícil. El coach evalúa
            cómo llevaste el pitch, las objeciones y el cierre.
          </p>
        </div>
      </section>
    </main>
  );
}
