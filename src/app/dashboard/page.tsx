import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nombre =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "vendedor";

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-verde font-medium">
            MyS Sites
          </p>
          <h1 className="text-2xl font-semibold text-cafe">
            Hola, {nombre.split(" ")[0]}
          </h1>
        </div>
        <SignOutButton />
      </header>

      <section className="rounded-2xl border border-border bg-white/60 p-6 space-y-2">
        <h2 className="text-lg font-semibold">Tu progreso</h2>
        <p className="text-sm text-cafe/70">
          El curso todavía no arranca — pronto verás aquí tu día actual, la
          práctica pendiente y tus prospectos asignados.
        </p>
      </section>
    </main>
  );
}
