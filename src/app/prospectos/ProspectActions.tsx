"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Action = "seguimiento" | "listo_pago" | "cerrado_sin_venta";

type Props = {
  prospectId: string;
  estado: string;
  yaTieneDeal: boolean;
};

const PLANES = [
  { key: "temporada", label: "Temporada", monto: "$2,000" },
  { key: "negocio", label: "Negocio", monto: "$4,500" },
  { key: "completo", label: "Completo", monto: "$12,000" },
] as const;

export default function ProspectActions({
  prospectId,
  estado,
  yaTieneDeal,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<Action | null>(null);
  const [notas, setNotas] = useState("");
  const [plan, setPlan] = useState<"temporada" | "negocio" | "completo">("negocio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const cerrado = estado.startsWith("cerrado");

  async function submit(action: Action) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendedor/prospect-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospectId,
          action,
          notas: notas.trim() || undefined,
          plan: action === "listo_pago" ? plan : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setModal(null);
        setNotas("");
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(false);
    }
  }

  if (cerrado) {
    return (
      <p className="text-xs text-cafe/50 italic">Prospecto cerrado — sin más acciones.</p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => setModal("seguimiento")}
          className="text-xs rounded-full bg-verde text-crema px-4 py-1.5 hover:bg-verde/90 transition"
        >
          Reportar seguimiento
        </button>
        {!yaTieneDeal && (
          <button
            onClick={() => setModal("listo_pago")}
            className="text-xs rounded-full bg-terracota text-crema px-4 py-1.5 hover:bg-terracota-oscuro transition"
          >
            Cliente listo para pagar
          </button>
        )}
        <button
          onClick={() => setModal("cerrado_sin_venta")}
          className="text-xs rounded-full border border-border text-cafe px-4 py-1.5 hover:bg-white/60 transition"
        >
          Cerrado sin venta
        </button>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-cafe/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !loading && setModal(null)}
        >
          <div
            className="bg-crema border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-cafe">
              {modal === "seguimiento"
                ? "Reportar seguimiento"
                : modal === "listo_pago"
                ? "Cliente listo para pagar"
                : "Cerrar sin venta"}
            </h4>

            {modal === "listo_pago" && (
              <div className="space-y-2">
                <p className="text-xs text-cafe/70">¿Qué plan eligió?</p>
                <div className="grid grid-cols-3 gap-2">
                  {PLANES.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPlan(p.key)}
                      className={`rounded-lg border px-2 py-2 text-xs transition ${
                        plan === p.key
                          ? "border-terracota bg-terracota/10 text-terracota"
                          : "border-border text-cafe hover:bg-white/60"
                      }`}
                    >
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-[10px] opacity-70">{p.monto}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-cafe/60 italic pt-1">
                  Al confirmar, se crea un deal y MyS Sites recibe la señal para
                  enviar los datos de pago directo al cliente. Tú NO compartes datos.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-cafe/70">
                Notas {modal === "seguimiento" ? "(qué hablaste, próximo paso)" : "(opcional)"}
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder={
                  modal === "seguimiento"
                    ? "Ej: hablé con Doña Chelo, me pidió cotización el jueves."
                    : ""
                }
                className="w-full rounded-lg border border-border bg-white p-2 text-sm focus:outline-none focus:border-terracota"
              />
            </div>

            {error && (
              <p className="text-sm text-terracota-oscuro">Error: {error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModal(null)}
                disabled={loading}
                className="flex-1 rounded-full border border-border text-cafe px-4 py-2 text-sm hover:bg-white/60 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => submit(modal)}
                disabled={loading}
                className={`flex-1 rounded-full text-crema px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                  modal === "cerrado_sin_venta"
                    ? "bg-cafe hover:bg-cafe/90"
                    : "bg-terracota hover:bg-terracota-oscuro"
                }`}
              >
                {loading ? "Enviando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
