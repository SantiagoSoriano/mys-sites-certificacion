"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Vendedor = {
  id: string;
  nombre: string;
  prospectosActivos: number;
  certificado: boolean;
};

type Props = {
  prospectId: string;
  vendedores: Vendedor[];
};

export default function AssignButton({ prospectId, vendedores }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function assign(vendedorId: string) {
    setLoading(vendedorId);
    setError(null);
    try {
      const res = await fetch("/api/admin/prospects/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId, vendedor_id: vendedorId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setOpen(false);
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(null);
    }
  }

  if (vendedores.length === 0) {
    return (
      <span className="text-xs text-cafe/40 italic">Sin vendedores</span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-terracota text-crema px-3 py-1 text-xs font-medium hover:bg-terracota-oscuro transition"
      >
        Asignar →
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 w-64 rounded-xl border border-border bg-crema shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-cafe/60 font-medium">
                Asignar a
              </p>
            </div>
            {vendedores.map((v) => {
              const lleno = v.prospectosActivos >= 5;
              return (
                <button
                  key={v.id}
                  onClick={() => assign(v.id)}
                  disabled={loading !== null}
                  className="block w-full text-left text-sm px-3 py-2 hover:bg-white/60 disabled:opacity-60 transition border-b border-border last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-cafe font-medium truncate">
                        {v.nombre}
                        {v.certificado && (
                          <span className="text-[10px] text-verde ml-2">✓</span>
                        )}
                      </p>
                      <p className="text-[10px] text-cafe/60">
                        {v.prospectosActivos}/5 activos{lleno && " · lleno"}
                      </p>
                    </div>
                    {loading === v.id && (
                      <span className="text-xs text-cafe/60">...</span>
                    )}
                  </div>
                </button>
              );
            })}
            {error && (
              <p className="text-[10px] text-terracota-oscuro px-3 py-2 border-t border-border">
                Error: {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
