import SignOutButton from "@/app/dashboard/sign-out-button";
import type { AppUser } from "@/lib/db/queries";
import { buildTabs } from "@/lib/nav";
import TabBar from "./TabBar";

type Props = {
  user: AppUser;
  variant: "vendedor" | "admin";
};

export default function TopNav({ user, variant }: Props) {
  const primerNombre = user.nombre.split(" ")[0];
  const label = variant === "admin" ? "MyS Sites · Admin" : "MyS Sites · Vendedor";
  const accent = variant === "admin" ? "text-terracota" : "text-verde";
  const tabs = buildTabs(user.rol);

  return (
    <header className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className={`text-xs uppercase tracking-widest ${accent} font-medium`}>
            {label}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-cafe mt-1">
            Hola, {primerNombre}
          </h1>
        </div>
        <SignOutButton />
      </div>
      <TabBar tabs={tabs} />
    </header>
  );
}
