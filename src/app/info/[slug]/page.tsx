import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import { INFO_SECTIONS, getInfoSection, type InfoBlock } from "@/lib/info-content";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return INFO_SECTIONS.map((s) => ({ slug: s.slug }));
}

export default async function InfoSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = getInfoSection(slug);
  if (!section) notFound();

  const { user } = await requireUser();

  const currentIdx = INFO_SECTIONS.findIndex((s) => s.slug === slug);
  const next = INFO_SECTIONS[currentIdx + 1];
  const prev = INFO_SECTIONS[currentIdx - 1];

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <div>
        <Link
          href="/info"
          className="text-xs uppercase tracking-widest text-verde hover:text-verde/80 transition"
        >
          ← Información
        </Link>
        <h2 className="text-3xl font-semibold text-cafe mt-2">{section.titulo}</h2>
        <p className="text-sm text-cafe/70 mt-1">{section.descripcion}</p>
      </div>

      <article className="space-y-5 rounded-2xl border border-border bg-white/60 p-6 sm:p-8">
        {section.cuerpo.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      <nav className="flex items-center justify-between text-sm pt-2">
        {prev ? (
          <Link href={`/info/${prev.slug}`} className="text-cafe/70 hover:text-cafe">
            ← {prev.titulo}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/info/${next.slug}`} className="text-terracota hover:text-terracota-oscuro font-medium">
            {next.titulo} →
          </Link>
        ) : (
          <Link href="/info" className="text-verde hover:text-verde/80 font-medium">
            Volver al índice
          </Link>
        )}
      </nav>
    </main>
  );
}

function Block({ block }: { block: InfoBlock }) {
  switch (block.tipo) {
    case "parrafo":
      return <p className="text-cafe/85 leading-relaxed">{block.texto}</p>;
    case "subtitulo":
      return (
        <h3 className="text-lg font-semibold text-cafe pt-3">{block.texto}</h3>
      );
    case "lista":
      return (
        <ul className="space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-cafe/85">
              <span className="text-terracota">•</span>
              <span className="flex-1">{it}</span>
            </li>
          ))}
        </ul>
      );
    case "tabla_planes":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose">
          {block.planes.map((p) => (
            <div
              key={p.nombre}
              className="rounded-xl border border-border bg-crema/60 p-4 space-y-2"
            >
              <p className="text-xs uppercase tracking-widest text-verde font-medium">
                Plan
              </p>
              <h4 className="text-xl font-semibold text-cafe">{p.nombre}</h4>
              <p className="text-2xl font-semibold text-terracota">{p.precio}</p>
              <p className="text-xs text-cafe/60">{p.entrega}</p>
              <ul className="space-y-1 pt-2">
                {p.incluye.map((it, i) => (
                  <li key={i} className="text-sm text-cafe/85 flex gap-2">
                    <span className="text-verde">✓</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "pasos":
      return (
        <ol className="space-y-4">
          {block.pasos.map((p, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-terracota text-crema text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-cafe">{p.titulo}</p>
                <p className="text-sm text-cafe/75 mt-0.5">{p.detalle}</p>
              </div>
            </li>
          ))}
        </ol>
      );
  }
}
