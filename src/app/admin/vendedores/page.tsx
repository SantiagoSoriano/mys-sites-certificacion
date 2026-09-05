import Link from "next/link";
import { requireAdmin, pesos } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import DeleteUserButton from "./DeleteUserButton";
import Superpowers from "./Superpowers";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
});

export default async function AdminVendedoresPage() {
  const { supabase, user } = await requireAdmin();

  const { data: vendedores } = await supabase
    .from("users")
    .select(
      `id, nombre, email, rol, last_login_at,
       enrollments(dia_actual, estado),
       certifications(fecha_certificacion),
       prospects:prospects!prospects_asignado_a_fkey(id),
       commissions(monto, estado)`
    )
    .order("nombre");

  const rows = (vendedores ?? []) as unknown as Array<{
    id: string;
    nombre: string;
    email: string;
    rol: "vendedor" | "admin";
    last_login_at: string | null;
    enrollments: { dia_actual: number; estado: string } | null;
    certifications: { fecha_certificacion: string } | null;
    prospects: { id: string }[];
    commissions: { monto: number; estado: string }[];
  }>;

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <TopNav user={user} variant="admin" />

      <div>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-terracota hover:opacity-80">
          ← Panel admin
        </Link>
        <h2 className="text-2xl font-semibold text-cafe mt-2">Vendedores</h2>
        <p className="text-sm text-cafe/70 mt-1">
          {rows.length} {rows.length === 1 ? "cuenta registrada" : "cuentas registradas"}.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white/60">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
            <tr>
              <th className="px-3 py-3 font-medium">Nombre</th>
              <th className="px-3 py-3 font-medium">Curso</th>
              <th className="px-3 py-3 font-medium">Prosp.</th>
              <th className="px-3 py-3 font-medium">Cobrada</th>
              <th className="px-3 py-3 font-medium">Ingreso</th>
              <th className="px-3 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const totalCobrada = v.commissions
                .filter((c) => c.estado === "pagado_efectivo")
                .reduce((s, c) => s + Number(c.monto), 0);
              const dia = v.enrollments?.dia_actual;
              const cert = !!v.certifications;
              const cursoLabel = dia
                ? `${dia}/8${cert ? " ✓" : ""}`
                : cert
                ? "✓"
                : "—";
              return (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <div className="text-cafe font-medium flex items-center gap-2">
                      <span className="truncate">{v.nombre}</span>
                      {v.rol === "admin" && (
                        <span className="text-[9px] uppercase tracking-widest text-terracota bg-terracota/10 px-1.5 py-0.5 rounded-full">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-cafe/60 truncate">{v.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cert ? "text-verde font-medium" : "text-cafe/85"}>
                      {cursoLabel}
                    </span>
                    {v.enrollments?.estado === "archivado" && (
                      <div className="text-[9px] text-cafe/50">archivado</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-cafe/85">{v.prospects.length}</td>
                  <td className="px-3 py-3 text-cafe font-semibold whitespace-nowrap">
                    {pesos(totalCobrada)}
                  </td>
                  <td className="px-3 py-3 text-xs text-cafe/70 whitespace-nowrap">
                    {v.last_login_at ? dateFmt.format(new Date(v.last_login_at)) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {v.rol !== "admin" && (
                        <Superpowers
                          userId={v.id}
                          userName={v.nombre}
                          isCertified={cert}
                          currentDay={dia ?? 1}
                          archived={v.enrollments?.estado === "archivado"}
                        />
                      )}
                      <DeleteUserButton
                        userId={v.id}
                        userName={v.nombre}
                        disabled={v.id === user.id || v.rol === "admin"}
                        disabledReason={
                          v.id === user.id
                            ? "No puedes borrarte a ti mismo"
                            : v.rol === "admin"
                            ? "No puedes borrar a otro admin desde la UI"
                            : undefined
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-cafe/60">
                  Aún no hay vendedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
