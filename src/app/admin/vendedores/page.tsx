import Link from "next/link";
import { requireAdmin, pesos } from "@/lib/db/queries";
import TopNav from "@/components/TopNav";
import DeleteUserButton from "./DeleteUserButton";
import Superpowers from "./Superpowers";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "short" });

export default async function AdminVendedoresPage() {
  const { supabase, user } = await requireAdmin();

  const { data: vendedores } = await supabase
    .from("users")
    .select(
      `id, nombre, email, rol, last_login_city, last_login_at,
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
    last_login_city: string | null;
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

      <div className="rounded-2xl border border-border bg-white/60 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-[10px] uppercase tracking-widest text-cafe/60 bg-crema/60">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Curso</th>
              <th className="px-4 py-3 font-medium">Cert</th>
              <th className="px-4 py-3 font-medium">Prospectos</th>
              <th className="px-4 py-3 font-medium">Cobrada</th>
              <th className="px-4 py-3 font-medium">Último ingreso</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const totalCobrada = v.commissions
                .filter((c) => c.estado === "pagado_efectivo")
                .reduce((s, c) => s + Number(c.monto), 0);
              return (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="text-cafe font-medium">{v.nombre}</div>
                    <div className="text-xs text-cafe/60">{v.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {v.rol === "admin" ? (
                      <span className="text-xs font-medium text-terracota">Admin</span>
                    ) : (
                      <span className="text-xs text-cafe/70">Vendedor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-cafe/85">
                    {v.enrollments ? (
                      <>
                        <span>{v.enrollments.dia_actual}/8</span>
                        {v.enrollments.estado === "archivado" && (
                          <span className="ml-2 text-xs text-cafe/50">(archivado)</span>
                        )}
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {v.certifications ? (
                      <span className="text-xs text-verde font-medium">✓ Certificado</span>
                    ) : (
                      <span className="text-xs text-cafe/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-cafe/85">{v.prospects.length}</td>
                  <td className="px-4 py-3 text-cafe font-semibold">{pesos(totalCobrada)}</td>
                  <td className="px-4 py-3 text-xs text-cafe/70">
                    {v.last_login_at ? (
                      <>
                        {dateFmt.format(new Date(v.last_login_at))}
                        {v.last_login_city && (
                          <div className="text-[10px] text-cafe/50">{v.last_login_city}</div>
                        )}
                      </>
                    ) : "nunca"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {v.rol !== "admin" && (
                        <Superpowers
                          userId={v.id}
                          userName={v.nombre}
                          isCertified={!!v.certifications}
                          currentDay={v.enrollments?.dia_actual ?? 1}
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
                <td colSpan={8} className="px-4 py-8 text-center text-cafe/60">
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
