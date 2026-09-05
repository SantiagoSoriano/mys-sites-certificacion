"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Pregunta = { id: string; pregunta: string };
type ClientePractico = {
  id: string;
  nombre_ficticio: string;
  giro: string;
  dificultad: "facil" | "dificil";
  personalidad: string;
};
type Msg = { role: "user" | "assistant"; content: string };

type Fase = "intro" | "teoria" | "practica" | "enviando" | "resultado";

export default function ExamenRunner() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("intro");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [clientePractico, setClientePractico] = useState<ClientePractico | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    aprobado: boolean;
    theory: { score: number; feedback: string };
    practice: { score: number; feedback: string };
  } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function iniciar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exam/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setPreguntas(data.preguntas);
        setClientePractico(data.clientePractico);
        setFase("teoria");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(false);
    }
  }

  function updateRespuesta(id: string, val: string) {
    setRespuestas((r) => ({ ...r, [id]: val }));
  }

  const teoriaCompleta = preguntas.every(
    (p) => (respuestas[p.id] ?? "").trim().length >= 3
  );

  async function sendPracticeMsg(text: string) {
    if (!text.trim() || loading || !clientePractico) return;
    setLoading(true);
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    try {
      const res = await fetch("/api/practice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: clientePractico.id, history: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.turn) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.turn.respuesta }]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(false);
    }
  }

  async function finalizar() {
    if (!clientePractico) return;
    setFase("enviando");
    setError(null);
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuestasTeoricas: preguntas.map((p) => ({
            id: p.id,
            respuesta: respuestas[p.id] ?? "",
          })),
          practica: { business_id: clientePractico.id, history: messages },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setFase("practica");
      } else {
        setResultado({
          aprobado: data.aprobado,
          theory: data.theory,
          practice: data.practice,
        });
        setFase("resultado");
        router.refresh();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
      setFase("practica");
    }
  }

  // FASE: INTRO
  if (fase === "intro") {
    return (
      <div className="rounded-2xl bg-terracota text-crema p-6 sm:p-8 space-y-4">
        <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
          Vas a empezar el examen
        </p>
        <h3 className="text-2xl font-semibold">Dos partes, en orden</h3>
        <ol className="text-sm opacity-90 space-y-2 list-decimal list-inside">
          <li>Parte teórica: 6 preguntas cortas sobre el programa (planes, comisión, flujo de pago, reglas).</li>
          <li>Parte práctica: chat con un cliente difícil — llévalo hasta donde puedas.</li>
        </ol>
        <p className="text-xs opacity-75">
          Necesitas 8 o más en cada parte para certificarte. Si repruebas, tienes que esperar 12h para volver a intentar.
        </p>
        <button
          onClick={iniciar}
          disabled={loading}
          className="rounded-full bg-crema text-terracota px-6 py-3 text-sm font-medium hover:bg-white disabled:opacity-60 transition"
        >
          {loading ? "Preparando…" : "Empezar examen"}
        </button>
        {error && <p className="text-sm mt-2 opacity-90">Error: {error}</p>}
      </div>
    );
  }

  // FASE: TEORIA
  if (fase === "teoria") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-cafe text-crema p-5">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
            Parte 1 — Teórica
          </p>
          <h3 className="text-xl font-semibold mt-1">
            Contesta las {preguntas.length} preguntas
          </h3>
          <p className="text-sm opacity-85 mt-1">
            No hace falta ser exacto — el coach evalúa que capturas la idea correcta.
          </p>
        </div>
        {preguntas.map((p, i) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-white/60 p-5 space-y-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
              Pregunta {i + 1}
            </p>
            <p className="text-sm font-medium text-cafe">{p.pregunta}</p>
            <textarea
              value={respuestas[p.id] ?? ""}
              onChange={(e) => updateRespuesta(p.id, e.target.value)}
              rows={3}
              placeholder="Escribe tu respuesta…"
              className="w-full rounded-lg border border-border bg-white p-3 text-sm text-cafe focus:outline-none focus:border-terracota"
            />
          </div>
        ))}
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-cafe/60">
            {Object.values(respuestas).filter((v) => v.trim().length >= 3).length} /{" "}
            {preguntas.length} respondidas
          </p>
          <button
            onClick={() => setFase("practica")}
            disabled={!teoriaCompleta}
            className="rounded-full bg-terracota text-crema px-6 py-3 text-sm font-medium hover:bg-terracota-oscuro disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Continuar a parte práctica →
          </button>
        </div>
      </div>
    );
  }

  // FASE: PRACTICA
  if (fase === "practica" && clientePractico) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-cafe text-crema p-5">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
            Parte 2 — Práctica
          </p>
          <h3 className="text-xl font-semibold mt-1">
            Vende un plan a {clientePractico.nombre_ficticio}
          </h3>
          <p className="text-xs opacity-85 mt-2">
            {clientePractico.giro} · {clientePractico.dificultad === "dificil" ? "Cliente exigente" : "Cliente abierto"}
          </p>
          <p className="text-sm opacity-90 mt-3">{clientePractico.personalidad}</p>
        </div>

        <div
          ref={chatRef}
          className="rounded-2xl border border-border bg-white/60 p-4 h-96 overflow-y-auto flex flex-col gap-3"
        >
          {messages.length === 0 && (
            <p className="text-sm text-cafe/60 text-center my-auto">
              Escribe tu primer mensaje para arrancar.
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPracticeMsg(input);
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

        {error && <p className="text-sm text-terracota-oscuro">Error: {error}</p>}

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-cafe/60">
            {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
          </span>
          <button
            onClick={finalizar}
            disabled={messages.length < 4}
            className="rounded-full bg-cafe text-crema px-5 py-2 text-sm font-medium hover:bg-cafe/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            Terminar examen y calificar
          </button>
        </div>
      </div>
    );
  }

  // FASE: ENVIANDO
  if (fase === "enviando") {
    return (
      <div className="rounded-2xl bg-cafe text-crema p-8 text-center space-y-2">
        <p className="text-4xl">⏳</p>
        <h3 className="text-xl font-semibold">Calificando tu examen…</h3>
        <p className="text-sm opacity-85">
          El coach está evaluando las 2 partes. Un momento.
        </p>
      </div>
    );
  }

  // FASE: RESULTADO
  if (fase === "resultado" && resultado) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl p-6 sm:p-8 text-crema ${
            resultado.aprobado ? "bg-verde" : "bg-cafe"
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium">
            {resultado.aprobado ? "Aprobado" : "Reprobado"}
          </p>
          <h3 className="text-3xl font-semibold mt-1">
            {resultado.aprobado
              ? "¡Estás certificado!"
              : "No aprobaste esta vez"}
          </h3>
          {resultado.aprobado && (
            <p className="text-sm opacity-90 mt-1">
              Ya puedes recibir prospectos reales y ganar comisión.
            </p>
          )}
          {!resultado.aprobado && (
            <p className="text-sm opacity-90 mt-1">
              Necesitas 8+ en las dos partes. Puedes reintentar en 12 horas.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ScoreCard
            titulo="Parte teórica"
            score={resultado.theory.score}
            feedback={resultado.theory.feedback}
          />
          <ScoreCard
            titulo="Parte práctica"
            score={resultado.practice.score}
            feedback={resultado.practice.feedback}
          />
        </div>

        <div className="flex gap-2">
          <a
            href="/dashboard"
            className="rounded-full bg-terracota text-crema px-6 py-3 text-sm font-medium hover:bg-terracota-oscuro transition"
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    );
  }

  return null;
}

function ScoreCard({
  titulo,
  score,
  feedback,
}: {
  titulo: string;
  score: number;
  feedback: string;
}) {
  const color =
    score >= 8 ? "text-verde" : score >= 6 ? "text-terracota" : "text-terracota-oscuro";
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-5 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-cafe/60 font-medium">
        {titulo}
      </p>
      <p className={`text-4xl font-semibold ${color}`}>
        {score}
        <span className="text-xl text-cafe/50">/10</span>
      </p>
      <p className="text-xs text-cafe/75 whitespace-pre-wrap">{feedback}</p>
    </div>
  );
}
