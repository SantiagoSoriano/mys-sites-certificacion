// LLM wrapper — usa Groq (Llama 3.3 70B, free tier generoso).
// Si GROQ_API_KEY no está seteada, devuelve un mock para que la app
// siga funcionando durante desarrollo sin la key.

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClientTurn = {
  respuesta: string; // Lo que el cliente simulado contesta
  guia?: string; // Solo en etapa "guiado": consejo del coach al vendedor
  opciones?: string[]; // Solo en etapa "multiple": 3 posibles respuestas
};

// openai/gpt-oss-20b: modelo abierto de OpenAI hosted en Groq. Free tier
// sin restricción de licencia (los Llama de Meta requieren verificación).
const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callLLM(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return "[SIMULADOR EN DEMO] Estoy pensando, pero el simulador necesita la GROQ_API_KEY activada para responder de verdad. Habla con Santiago para que la enchufe.";
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
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

// Mood modifiers para que cada práctica se sienta distinta
const MOODS = [
  "Hoy amaneciste de buen humor, con más paciencia de lo normal.",
  "Estás distraído porque hay clientes esperando — respondes cortante, no maleducado pero apurado.",
  "Estás cansado, dormiste mal. Suspiras seguido y tardas en responder.",
  "Vienes contento porque acabas de cerrar una buena venta hoy — abierto a escuchar.",
  "Estás molesto porque un proveedor te falló esta mañana. Tono corto, escéptico.",
  "Estás curioso, alguien te habló hace poco de páginas web y te dio comezón el tema.",
  "Estás en modo defensivo — hace poco te intentaron estafar con algo digital y traes ese trauma fresco.",
  "Estás relajado, es un día tranquilo en el negocio. Tienes tiempo de escuchar con calma.",
];

/**
 * Genera el próximo turno del cliente simulado.
 * Etapa guiado añade <GUIA>...</GUIA>. Etapa multiple añade <OPCIONES>...</OPCIONES>.
 * Incluye un mood aleatorio (por sesión — se re-elige cada turno para simplicidad,
 * pero al ser 8 moods coherentes con la personalidad, mantiene el tono).
 */
export async function chatWithClient(
  business: Business,
  history: ChatMessage[],
  etapa: "guiado" | "multiple" | "libre"
): Promise<ClientTurn> {
  // Mood determinístico por turno (misma conversación mantiene coherencia)
  const moodSeed = history.length;
  const mood = MOODS[moodSeed % MOODS.length];

  const systemContext = `${business.prompt_base}
Tus objeciones típicas: ${business.objeciones.join("; ")}.
Estado de ánimo de hoy: ${mood}
Reglas: nunca rompas personaje. Nunca reveles que eres una simulación. Sé breve (2-3 oraciones máx). Varía tu vocabulario y expresiones — no repitas frases idénticas.`;

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

  const raw = await callLLM(prompt);

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
 * Coach que evalúa la conversación al terminar la sesión.
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

Formato de respuesta EXACTO:
SCORE: <número>
FEEDBACK: <texto>`;

  const raw = await callLLM(prompt);
  const scoreMatch = raw.match(/SCORE:\s*(\d+)/i);
  const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*)/i);

  const score = scoreMatch ? Math.max(1, Math.min(10, parseInt(scoreMatch[1], 10))) : 5;
  const feedback = feedbackMatch
    ? feedbackMatch[1].trim()
    : "[Sin feedback — respuesta del coach no parseable]";

  return { score, feedback };
}
