"use client";

import { useState } from "react";
import { fraseRandom } from "@/lib/motivation";

export default function FraseCard({ initial }: { initial: string }) {
  const [frase, setFrase] = useState(initial);
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    setFrase((prev) => fraseRandom(prev));
    setTimeout(() => setSpinning(false), 500);
  }

  return (
    <div className="flex-1 rounded-2xl border border-border bg-terracota/10 px-5 py-4 relative group">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
          Frase del día
        </p>
        <button
          onClick={refresh}
          aria-label="Nueva frase"
          className="text-cafe/50 hover:text-terracota transition"
          title="Refrescar frase"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={spinning ? "animate-spin" : ""}
          >
            <path d="M21 12a9 9 0 1 1-3.51-7.11" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      </div>
      <p className="text-cafe italic mt-1 leading-snug">&ldquo;{frase}&rdquo;</p>
    </div>
  );
}
