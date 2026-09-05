"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };
type Etapa = "guiado" | "multiple" | "libre";

type Props = {
  businessId: string;
  businessNombre: string;
};

export default function PracticaChat({ businessId, businessNombre }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [guia, setGuia] = useState<string | null>(null);
  const [guiaDismissed, setGuiaDismissed] = useState(false);
  const [opciones, setOpciones] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, guia, opciones]);

  async function send(text: string) {
    if (!text.trim() || loading || result) return;
    setLoading(true);
    setError(null);
    setGuia(null);
    setGuiaDismissed(false);
    setOpciones(null);

    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/practice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          history: newMessages,
        }),
      });
      const data = (await res.json()) as {
        turn?: { respuesta: string; guia?: string; opciones?: string[] };
        etapa?: Etapa;
        error?: string;
      };
      if (!res.ok || !data.turn) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.turn!.respuesta },
        ]);
        setEtapa(data.etapa ?? null);
        setGuia(data.turn.guia ?? null);
        setOpciones(data.turn.opciones ?? null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network_error");
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    if (messages.length < 2) {
      setError("Ten al menos un intercambio antes de terminar.");
      return;
    }
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          history: messages,
        }),
      });
      const data = (await res.json()) as {
        score?: number;
        feedback?: string;
        error?: string;
      };
      if (!res.ok || data.score === undefined) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setResult({ score: data.score, feedback: data.feedback ?? "" });
        router.refresh();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network_error");
    } finally {
      setFinishing(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl bg-verde text-crema p-6 sm:p-8 space-y-4">
        <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
          Práctica evaluada
        </p>
        <div className="flex items-baseline gap-3">
          <p className="text-6xl font-semibold">{result.score}</p>
          <p className="text-xl opacity-90">/ 10</p>
        </div>
        <p className="text-sm opacity-90 whitespace-pre-wrap">{result.feedback}</p>
        <div className="flex gap-3 pt-2">
          <a
            href="/curso"
            className="rounded-full bg-crema text-verde px-5 py-2 text-sm font-medium hover:bg-white transition"
          >
            Volver al curso
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        className="rounded-2xl border border-border bg-white/60 p-4 h-96 overflow-y-auto flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-cafe/60 text-center my-auto">
            Escribe tu primer mensaje para arrancar la conversación con{" "}
            {businessNombre}.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-terracota text-crema"
                : "self-start bg-cafe/10 text-cafe"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-cafe/10 text-cafe rounded-2xl px-4 py-2 text-sm italic">
            Escribiendo…
          </div>
        )}
      </div>

      {etapa === "guiado" && guia && !guiaDismissed && (
        <GuiaModal guia={guia} onClose={() => setGuiaDismissed(true)} />
      )}

      {etapa === "guiado" && guia && guiaDismissed && (
        <button
          onClick={() => setGuiaDismissed(false)}
          className="text-xs text-verde underline underline-offset-4 hover:text-verde/80 transition self-start"
        >
          Ver ayuda del coach
        </button>
      )}

      {etapa === "multiple" && opciones && opciones.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
            Elige tu respuesta
          </p>
          {opciones.map((opt, i) => (
            <button
              key={i}
              onClick={() => send(opt)}
              disabled={loading}
              className="block w-full text-left rounded-xl border border-border bg-white/70 p-3 text-sm hover:bg-white transition disabled:opacity-60"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(etapa === "libre" || !etapa || etapa === "guiado") && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu respuesta…"
            className="flex-1 rounded-full border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:border-terracota"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-terracota text-crema px-5 py-3 text-sm font-medium hover:bg-terracota-oscuro disabled:opacity-60 transition"
          >
            Enviar
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm text-terracota-oscuro">Error: {error}</p>
      )}

      <div className="pt-3 border-t border-border flex justify-between items-center">
        <span className="text-xs text-cafe/60">
          {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
        </span>
        <button
          onClick={finish}
          disabled={finishing || messages.length < 2}
          className="rounded-full bg-cafe text-crema px-5 py-2 text-sm font-medium hover:bg-cafe/90 disabled:opacity-60 transition"
        >
          {finishing ? "Calificando…" : "Terminar y calificar"}
        </button>
      </div>
    </div>
  );
}

function GuiaModal({
  guia,
  onClose,
}: {
  guia: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-cafe/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-crema border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-verde font-medium">
              Coach
            </p>
            <h4 className="text-lg font-semibold text-cafe mt-0.5">
              Ayuda para tu próxima respuesta
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-cafe/60 hover:text-cafe text-2xl leading-none px-2"
            aria-label="Cerrar guía"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-cafe/85 leading-relaxed whitespace-pre-wrap">
          {guia}
        </p>
        <button
          onClick={onClose}
          className="w-full mt-2 rounded-full bg-verde text-crema py-2 text-sm font-medium hover:bg-verde/90 transition"
        >
          Entendido, escribo mi respuesta
        </button>
      </div>
    </div>
  );
}
