import type { LeaderEntrenamiento, LeaderCertificado } from "@/lib/db/queries";
import { pesos } from "@/lib/db/queries";

type Props = {
  entrenamiento: LeaderEntrenamiento[];
  certificados: LeaderCertificado[];
  highlightUserId?: string;
};

export default function Leaderboards({
  entrenamiento,
  certificados,
  highlightUserId,
}: Props) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-terracota">
            En entrenamiento
          </h3>
          <span className="text-xs text-cafe/60">{entrenamiento.length}</span>
        </div>
        {entrenamiento.length === 0 ? (
          <p className="text-sm text-cafe/60 italic">
            Nadie está haciendo el curso ahora mismo.
          </p>
        ) : (
          <ol className="space-y-2">
            {entrenamiento.map((v, i) => (
              <li
                key={v.id}
                className={`flex items-center gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0 ${
                  v.id === highlightUserId ? "bg-terracota/5 -mx-2 px-2 rounded-lg" : ""
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    i === 0
                      ? "bg-terracota text-crema"
                      : i === 1
                      ? "bg-cafe/30 text-cafe"
                      : i === 2
                      ? "bg-cafe/15 text-cafe"
                      : "bg-cafe/5 text-cafe/60"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-cafe font-medium truncate">
                    {v.nombre}
                    {v.id === highlightUserId && (
                      <span className="text-[10px] text-terracota ml-2">
                        (tú)
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-cafe/60">
                    Día {v.dia}/8 · {v.practicasCompletadas}{" "}
                    {v.practicasCompletadas === 1 ? "práctica" : "prácticas"}
                  </p>
                </div>
                {v.scorePromedio !== null && (
                  <span className="text-xs text-terracota font-semibold">
                    {v.scorePromedio}/10
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="text-[10px] text-cafe/50 italic pt-1">
          Ordenados por día del curso, después por score promedio.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-verde">
            Top vendedores certificados
          </h3>
          <span className="text-xs text-cafe/60">{certificados.length}</span>
        </div>
        {certificados.length === 0 ? (
          <p className="text-sm text-cafe/60 italic">
            Todavía nadie está certificado.
          </p>
        ) : (
          <ol className="space-y-2">
            {certificados.map((v, i) => (
              <li
                key={v.id}
                className={`flex items-center gap-3 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0 ${
                  v.id === highlightUserId ? "bg-verde/5 -mx-2 px-2 rounded-lg" : ""
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    i === 0
                      ? "bg-verde text-crema"
                      : i === 1
                      ? "bg-verde/30 text-verde"
                      : i === 2
                      ? "bg-verde/15 text-verde"
                      : "bg-cafe/5 text-cafe/60"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-cafe font-medium truncate">
                    {v.nombre}
                    {v.id === highlightUserId && (
                      <span className="text-[10px] text-verde ml-2">(tú)</span>
                    )}
                  </p>
                  <p className="text-[10px] text-cafe/60">
                    {v.ventasCerradas}{" "}
                    {v.ventasCerradas === 1 ? "venta" : "ventas"} cerradas
                  </p>
                </div>
                <span className="text-xs text-verde font-semibold">
                  {pesos(v.comisionTotal)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-[10px] text-cafe/50 italic pt-1">
          Ordenados por comisión total. Al certificarse alguien, sale de
          entrenamiento y entra aquí automáticamente.
        </p>
      </div>
    </section>
  );
}
