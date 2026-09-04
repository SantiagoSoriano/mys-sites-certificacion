import Link from "next/link";
import { requireUser } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import { INFO_SECTIONS } from "@/lib/info-content";

export const dynamic = "force-dynamic";

export default async function InfoIndexPage() {
  const { user } = await requireUser();

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-cafe">Información del programa</h2>
        <p className="text-sm text-cafe/70 max-w-2xl">
          Todo lo que necesitas saber para vender bien y sin líos — sin salir de la app.
          Repasa cualquier sección las veces que quieras.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INFO_SECTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/info/${s.slug}`}
            className="group rounded-2xl border border-border bg-white/60 p-5 hover:bg-white/90 transition"
          >
            <h3 className="text-lg font-semibold text-cafe group-hover:text-terracota transition">
              {s.titulo}
            </h3>
            <p className="text-sm text-cafe/70 mt-1">{s.descripcion}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
