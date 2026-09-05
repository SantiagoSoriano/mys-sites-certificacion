"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  giro: string;
  nombre_ficticio: string;
  dificultad: "facil" | "dificil";
};

export default function BusinessSeeder() {
  const router = useRouter();
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function seed() {
    setLoading(true);
    setError(null);
    setAdded(null);
    try {
      const res = await fetch("/api/admin/seed-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = (await res.json()) as {
        added?: number;
        businesses?: Business[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setAdded(data.businesses ?? []);
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-cafe">Generar negocios simulados</h3>
        <p className="text-sm text-cafe/70 mt-1">
          Agrega N negocios ficticios al catálogo del simulador. Se eligen giros
          y personalidades al azar de los templates.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-cafe/85 flex items-center gap-2">
          Cantidad:
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="w-16 rounded border border-border px-2 py-1 text-sm bg-white"
          />
        </label>
        <button
          onClick={seed}
          disabled={loading}
          className="rounded-full bg-terracota px-5 py-2 text-crema text-sm font-medium hover:bg-terracota-oscuro disabled:opacity-60 transition"
        >
          {loading ? "Generando…" : `Generar ${count}`}
        </button>
      </div>

      {error && (
        <p className="text-sm text-terracota-oscuro">Error: {error}</p>
      )}

      {added && added.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs uppercase tracking-widest text-verde font-medium mb-2">
            Agregados
          </p>
          <ul className="space-y-1 text-sm text-cafe/85">
            {added.map((b) => (
              <li key={b.id} className="flex justify-between gap-3">
                <span>{b.nombre_ficticio}</span>
                <span className="text-xs text-cafe/60">
                  {b.giro} · {b.dificultad}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
