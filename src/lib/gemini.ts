// Wrapper for Google Gemini API (free tier).
// If GEMINI_API_KEY is missing, returns a mock so the app still works
// during development without the key.

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClientTurn = {
  respuesta: string; // What the simulated client says back
  guia?: string; // Only in guided stage: coach hint for the sales rep
  opciones?: string[]; // Only in multiple-choice stage: 3 possible replies
};

const GEMINI_MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return "[SIMULADOR EN DEMO] Estoy pensando, pero el simulador necesita la API de Gemini activada para responder de verdad. Habla con Santiago para que la enchufe.";
  }

  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text.trim();
}

type Business = {
  nombre_ficticio: string;
  giro: string;
  dificultad: "facil" | "dificil";
  personalidad: string;
  objeciones: string[];
  prompt_base: string;
};

/**
 * Generates the next turn of the simulated client.
 * Stage tweaks: guiado adds a <guia>, multiple adds 3 options.
 */
export async function chatWithClient(
  business: Business,
  history: ChatMessage[],
  etapa: "guiado" | "multiple" | "libre"
): Promise<ClientTurn> {
  const systemContext = `${business.prompt_base}
Tus objeciones típicas: ${business.objeciones.join("; ")}.
Reglas: nunca rompas personaje. Nunca reveles que eres una simulación. Sé breve (2-3 oraciones máx).`;

  const historyStr = history
    .map((m) => `${m.role === "user" ? "Vendedor" : "Cliente"}: ${m.content}`)
    .join("\n");

  let extra = "";
  if (etapa === "guiado") {
    extra = `\n\nAdemás de tu respuesta, agrega al final un bloque <GUIA>...</GUIA> con un consejo breve para el vendedor sobre qué contestar y por qué.`;
  } else if (etapa === "multiple") {
    extra = `\n\nAdemás de tu respuesta, sugiere 3 posibles respuestas del vendedor (1 buena, 2 con errores comunes). Formato:\n<OPCIONES>\n1. ...\n2. ...\n3. ...\n</OPCIONES>`;
  }

  const prompt = `${systemContext}${extra}

Conversación hasta ahora:
${historyStr || "(el vendedor está por escribir el primer mensaje)"}

Responde SOLO como el cliente. No agregues nombres ni prefijos como "Cliente:".`;

  const raw = await callGemini(prompt);

  // Parse guía / opciones if present
  let respuesta = raw;
  let guia: string | undefined;
  let opciones: string[] | undefined;

  const guiaMatch = raw.match(/<GUIA>([\s\S]*?)<\/GUIA>/i);
  if (guiaMatch) {
    guia = guiaMatch[1].trim();
    respuesta = respuesta.replace(guiaMatch[0], "").trim();
  }

  const opcionesMatch = raw.match(/<OPCIONES>([\s\S]*?)<\/OPCIONES>/i);
  if (opcionesMatch) {
    opciones = opcionesMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\d+\.\s*/, "").trim())
      .filter(Boolean);
    respuesta = respuesta.replace(opcionesMatch[0], "").trim();
  }

  return { respuesta, guia, opciones };
}

/**
 * Coach that evaluates the whole conversation after the session ends.
 */
export async function coachEvaluate(
  business: Business,
  history: ChatMessage[]
): Promise<{ score: number; feedback: string }> {
  const historyStr = history
    .map((m) => `${m.role === "user" ? "Vendedor" : "Cliente"}: ${m.content}`)
    .join("\n");

  const prompt = `Eres un coach de ventas para MyS Sites (agencia que vende sitios web a negocios pequeños en Puebla).
Acabas de observar esta práctica de venta simulada. El cliente era: ${business.nombre_ficticio} (${business.giro}, dificultad ${business.dificultad}).

Conversación:
${historyStr}

Da:
1. Un SCORE del 1 al 10 (número entero) considerando: apertura, escucha activa, manejo de objeciones, claridad del pitch, cierre.
2. Un FEEDBACK breve (3-4 oraciones máximo) con lo mejor que hizo y 1-2 cosas concretas a mejorar.

Formato de respuesta:
SCORE: <número>
FEEDBACK: <texto>`;

  const raw = await callGemini(prompt);
  const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
  const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*)/i);

  const score = scoreMatch ? Math.max(1, Math.min(10, parseInt(scoreMatch[1], 10))) : 5;
  const feedback = feedbackMatch
    ? feedbackMatch[1].trim()
    : "[Sin feedback — respuesta del coach no parseable]";

  return { score, feedback };
}
