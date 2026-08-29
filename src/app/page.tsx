import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-verde font-medium">
          Programa de certificación
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold">
          <span className="text-terracota">MyS</span>{" "}
          <span className="text-cafe">Sites</span>
        </h1>
        <p className="text-cafe/70 max-w-md mx-auto">
          Aprende a vender sitios web de verdad. Curso corto, examen, y comisión
          real por cada cliente que cierres.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full bg-terracota px-8 py-3 text-crema font-medium shadow-sm hover:bg-terracota-oscuro transition"
      >
        Entrar
      </Link>
    </main>
  );
}
