"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NotifItem = {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  prospect_id: string | null;
  leido: boolean;
  ts: string;
};

// Badge de notificaciones: bolita roja arriba a la derecha del tab bar.
// Poll cada 30s. Al hacer click, abre un mini panel con las últimas y las marca leídas.
export default function NotifBadge() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [abierto, setAbierto] = useState(false);

  async function fetchNotifs() {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items: NotifItem[]; sin_leer: number };
      setItems(j.items ?? []);
      setCount(j.sin_leer ?? 0);
    } catch {}
  }

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(t);
  }, []);

  async function abrir() {
    setAbierto((v) => !v);
    if (!abierto && count > 0) {
      // Optimistic
      setCount(0);
      try {
        await fetch("/api/notifications", { method: "POST" });
      } catch {}
    }
  }

  function irA(n: NotifItem) {
    setAbierto(false);
    if (n.prospect_id) router.push("/prospectos");
  }

  return (
    <div className="relative">
      <button
        onClick={abrir}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-cafe text-crema shadow-md hover:scale-105 transition"
        aria-label={`Notificaciones${count > 0 ? ` (${count} sin leer)` : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-crema border border-cafe/20 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-cafe/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-cafe uppercase tracking-wider">
              Notificaciones
            </span>
            <button
              onClick={() => setAbierto(false)}
              className="text-cafe/60 hover:text-cafe text-lg leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-cafe/60">
                Sin notificaciones todavía
              </li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => irA(n)}
                  className={`w-full text-left px-3 py-2 hover:bg-cafe/5 border-b border-cafe/5 ${
                    !n.leido ? "bg-terracota/5" : ""
                  }`}
                >
                  <div className="text-xs font-semibold text-cafe">{n.titulo}</div>
                  {n.cuerpo && (
                    <div className="text-xs text-cafe/70 truncate">{n.cuerpo}</div>
                  )}
                  <div className="text-[10px] text-cafe/50 mt-0.5">
                    {new Date(n.ts).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
