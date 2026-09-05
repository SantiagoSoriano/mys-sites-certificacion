"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyToggle({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function toggle() {
    const next = !mostrar;
    setLoading(true);
    setError(null);
    setMostrar(next); // optimista
    try {
      const res = await fetch("/api/user/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mostrar_ganancias: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setMostrar(!next); // rollback
      } else {
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
      setMostrar(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white/40 px-5 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-cafe">
          Mostrar mis ganancias en el ranking
        </p>
        <p className="text-xs text-cafe/60 mt-0.5">
          {mostrar
            ? "Todos ven cuánto has cobrado de comisión."
            : "Tu nombre y # de ventas sí se ven; el monto queda oculto."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          mostrar ? "bg-verde" : "bg-cafe/30"
        } disabled:opacity-60`}
        aria-label="Privacidad del monto de comisión"
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-crema shadow transition-transform ${
            mostrar ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
      {error && (
        <p className="text-xs text-terracota-oscuro">Error: {error}</p>
      )}
    </div>
  );
}
