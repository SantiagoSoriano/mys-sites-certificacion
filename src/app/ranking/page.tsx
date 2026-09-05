import { requireUser, getLeaderboardEntrenamiento, getLeaderboardCertificados } from "@/lib/db/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import TopNav from "@/components/TopNav";
import RankingTabs from "./RankingTabs";
import PrivacyToggle from "./PrivacyToggle";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const { supabase, user } = await requireUser();
  const adminClient = createAdminClient();

  const [entrenamiento, certificados, profileRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLeaderboardEntrenamiento(adminClient as any).catch(() => []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLeaderboardCertificados(adminClient as any).catch(() => []),
    supabase
      .from("users")
      .select("mostrar_ganancias")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const mostrarGanancias =
    (profileRes.data?.mostrar_ganancias as boolean | undefined) ?? true;

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <TopNav user={user} variant={user.rol === "admin" ? "admin" : "vendedor"} />

      <section>
        <h2 className="text-2xl font-semibold text-cafe">Ranking del programa</h2>
        <p className="text-sm text-cafe/70 mt-1">
          Los que van adelante en el curso y los que ya están vendiendo.
          Cuando alguien vende su primer sitio, entra al ranking de vendedores.
        </p>
      </section>

      <PrivacyToggle initialValue={mostrarGanancias} />

      <RankingTabs
        entrenamiento={entrenamiento}
        certificados={certificados}
        currentUserId={user.id}
      />
    </main>
  );
}
