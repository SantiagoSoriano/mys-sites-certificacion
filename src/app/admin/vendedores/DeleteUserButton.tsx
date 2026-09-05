"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  userName: string;
  disabled?: boolean;
  disabledReason?: string;
};

const CONFIRM_TEXT = "ELIMINAR";

export default function DeleteUserButton({
  userId,
  userName,
  disabled,
  disabledReason,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function doDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setModalOpen(false);
        setConfirmInput("");
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network_error");
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <span
        className="text-xs text-cafe/30 cursor-not-allowed"
        title={disabledReason}
      >
        Eliminar
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="text-xs text-terracota-oscuro hover:underline"
      >
        Eliminar
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-cafe/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="bg-crema border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-terracota-oscuro font-medium">
                Acción irreversible
              </p>
              <h4 className="text-xl font-semibold text-cafe mt-1">
                ¿Eliminar a {userName}?
              </h4>
              <p className="text-sm text-cafe/75 mt-2 leading-relaxed">
                Se borra su cuenta, su progreso del curso, sus prácticas,
                intentos de examen, prospectos asignados, deals y comisiones.
                No se puede deshacer.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-cafe/70">
                Para confirmar, escribe{" "}
                <span className="font-mono font-semibold text-terracota">
                  {CONFIRM_TEXT}
                </span>
                :
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-terracota"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-terracota-oscuro">Error: {error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setConfirmInput("");
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 rounded-full border border-border text-cafe px-4 py-2 text-sm hover:bg-white/60 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={doDelete}
                disabled={loading || confirmInput !== CONFIRM_TEXT}
                className="flex-1 rounded-full bg-terracota-oscuro text-crema px-4 py-2 text-sm font-medium hover:bg-terracota-oscuro/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? "Eliminando…" : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
