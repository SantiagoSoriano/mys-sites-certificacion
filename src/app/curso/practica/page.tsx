import Link from "next/link";
import { requireUser } from "@/lib/db/queries";
import { getBusinessById, getCursoData } from "@/lib/db/curso";
import TopNav from "@/components/TopNav";
import PracticaChat from "./PracticaChat";

export const dynamic = "force-dynamic";

const ETAPA_LABEL: Record<string, string> = {
  guiado: "Guiado (con ayuda)",
  multiple: "Opción múltiple",
  libre: "Libre",
};

export default async function PracticaPage({
  searchParams,
}: {
  searchParams: Promise<{ business_id?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { business_id: overrideId } = await searchParams;
  const data = await getCursoData(supabase, user.id);

  // Admin puede pasar ?business_id=xxx para probar cualquier negocio
  let business = data.business;
  let esOverride = false;
  if (overrideId && user.rol === "admin") {
    const override = await getBusinessById(supabase, overrideId);
    if (override) {
      business = override;
      esOverride = true;
    }
  }

  if (!business) {
    return (
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full space-y-6">
        <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />
        <Link href="/curso" className="text-xs uppercase tracking-widest text-verde">
          ← Curso
        </Link>
        <div className="rounded-2xl border border-border bg-white/60 p-5 text-sm text-cafe/70">
          No hay negocios en el catálogo del simulador. Pide a un admin que
          genere unos desde <Link href="/admin" className="underline">/admin</Link>.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full space-y-6">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <div>
        <Link
          href="/curso"
          className="text-xs uppercase tracking-widest text-verde hover:text-verde/80 transition"
        >
          ← Curso
        </Link>
        <h2 className="text-2xl font-semibold text-cafe mt-2">
          {esOverride ? "Práctica (modo admin)" : `Práctica del día ${data.dia}`}
        </h2>
        <p className="text-xs text-cafe/60 mt-1">
          Modo: {ETAPA_LABEL[data.etapa]}
          {esOverride && " · negocio elegido manualmente"}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
          Tu cliente
        </p>
        <h3 className="text-xl font-semibold text-cafe">
          {business.nombre_ficticio}
        </h3>
        <p className="text-xs text-cafe/70 capitalize">
          {business.giro} · {business.dificultad === "facil" ? "Fácil" : "Difícil"}
        </p>
        <p className="text-sm text-cafe/85 mt-2">{business.personalidad}</p>
      </div>

      <PracticaChat
        businessId={business.id}
        businessNombre={business.nombre_ficticio}
      />
    </main>
  );
}
