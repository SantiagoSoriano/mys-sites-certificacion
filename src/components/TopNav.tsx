import Link from "next/link";
import SignOutButton from "@/app/dashboard/sign-out-button";
import type { AppUser } from "@/lib/db/queries";

type Props = {
  user: AppUser;
  variant: "vendedor" | "admin";
};

export default function TopNav({ user, variant }: Props) {
  const primerNombre = user.nombre.split(" ")[0];
  const label = variant === "admin" ? "MyS Sites · Admin" : "MyS Sites · Vendedor";
  const accent = variant === "admin" ? "text-terracota" : "text-verde";

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className={`text-xs uppercase tracking-widest ${accent} font-medium`}>
          {label}
        </p>
        <h1 className="text-3xl font-semibold text-cafe mt-1">
          Hola, {primerNombre}
        </h1>
      </div>
      <nav className="flex items-center gap-5 text-sm">
        {variant === "vendedor" ? (
          <>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/info">Información</NavLink>
            {user.rol === "admin" && (
              <NavLink href="/admin" accent="terracota">
                Panel admin
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink href="/admin">Panel admin</NavLink>
            <NavLink href="/info">Información</NavLink>
            <NavLink href="/dashboard" accent="verde">
              Ver como vendedor
            </NavLink>
          </>
        )}
        <SignOutButton />
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
  accent = "cafe",
}: {
  href: string;
  children: React.ReactNode;
  accent?: "cafe" | "verde" | "terracota";
}) {
  const color =
    accent === "verde"
      ? "text-verde hover:text-verde/80"
      : accent === "terracota"
      ? "text-terracota hover:text-terracota-oscuro"
      : "text-cafe/80 hover:text-cafe";
  return (
    <Link href={href} className={`${color} underline underline-offset-4 transition`}>
      {children}
    </Link>
  );
}
