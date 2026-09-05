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

// openai/gpt-oss-120b: modelo abierto de OpenAI hosted en Groq, 120B.
// Free tier sin restricción de licencia. Mucho mejor siguiendo instrucciones
// que el 20B, cual era muy corto y confundía contexto.
const GROQ_MODEL = "openai/gpt-oss-120b";
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

// Mood modifiers para que cada práctica se sienta distinta.
// TODOS en segunda persona apuntando al CLIENTE — nunca ambiguo respecto al vendedor.
const MOODS = [
  "Tú (el dueño del negocio) amaneciste de buen humor, con paciencia extra hoy.",
  "Tú (el dueño del negocio) estás distraído porque hay clientes esperando en tu local — respondes cortante, no maleducado pero apurado.",
  "Tú (el dueño del negocio) estás cansado, dormiste mal. Suspiras seguido y tardas en contestar.",
  "Tú (el dueño del negocio) tuviste buenas ventas propias esta mañana — estás animado y abierto a escuchar propuestas.",
  "Tú (el dueño del negocio) estás molesto porque un proveedor tuyo te falló esta mañana. Tono corto, escéptico.",
  "Tú (el dueño del negocio) estás curioso porque alguien te habló hace poco de páginas web y te dio comezón el tema.",
  "Tú (el dueño del negocio) estás en modo defensivo — hace poco te intentaron estafar con algo digital y traes ese trauma fresco.",
  "Tú (el dueño del negocio) estás relajado, es un día tranquilo. Tienes tiempo de escuchar con calma.",
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

  // Regla de progresión de la conversación — aplica a TODOS los turnos.
  // El cliente no "salta" a objeciones específicas hasta que el vendedor
  // haya dado suficiente contexto.
  const contextoTurno = `\n\nREGLA DE PROGRESIÓN (crítica):
El cliente responde de forma proporcional a lo que ya sabe. Solo saca objeciones específicas cuando el vendedor haya cubierto EN CONVERSACIONES ANTERIORES estos 4 puntos:
  1. Su nombre y de qué agencia/empresa es.
  2. QUÉ producto o servicio ofrece (concreto: "hago sitios web").
  3. POR QUÉ le podría interesar a ESTE cliente específicamente.
  4. Alguna idea de precio, tiempo de entrega o cómo funciona.

Si al vendedor le FALTA cubrir alguno de esos 4 puntos, tu respuesta debe SER UNA PREGUNTA para hacer que él lo explique. Ejemplos según lo que falte:
  - Falta 1: "¿Con quién hablo?" / "¿De qué agencia me hablas?"
  - Falta 2: "¿Y qué es exactamente lo que haces?" / "Explícame de qué va."
  - Falta 3: "¿Y por qué crees que a mí me sirve?" / "¿Qué gano yo con eso?"
  - Falta 4: "¿Cuánto cuesta?" / "¿En cuánto tiempo lo tienes listo?"

SOLO después de que el vendedor haya cubierto los 4 puntos (o al menos 3), puedes empezar a dar tus objeciones típicas.

NO inventes contexto que el vendedor no ha dicho. NO menciones cosas específicas de tu negocio hasta que el vendedor te dé razón para ello.`;

  const historyStr = history
    .map((m) => `${m.role === "user" ? "Vendedor" : "Cliente"}: ${m.content}`)
    .join("\n");

  let extra = "";
  if (etapa === "guiado") {
    extra = `\n\nDespués de tu respuesta como cliente, añade EN UNA LÍNEA SEPARADA un consejo para el vendedor sobre qué debería contestar y por qué. El consejo va OBLIGATORIAMENTE entre estas etiquetas exactas, incluida la de cierre:
<GUIA>consejo aquí</GUIA>
No omitas la etiqueta </GUIA>. No uses las etiquetas dentro de tu respuesta como cliente.`;
  } else if (etapa === "multiple") {
    extra = `\n\nDespués de tu respuesta como cliente, añade 3 posibles respuestas del vendedor (1 buena, 2 con errores comunes) entre estas etiquetas exactas:
<OPCIONES>
1. ...
2. ...
3. ...
</OPCIONES>
No omitas la etiqueta </OPCIONES>.`;
  }

  const prompt = `${systemContext}${contextoTurno}${extra}

Conversación hasta ahora:
${historyStr || "(el vendedor está por escribir el primer mensaje)"}

Responde SOLO como el cliente. No agregues nombres ni prefijos como "Cliente:".`;

  const raw = await callLLM(prompt);

  let respuesta = raw;
  let guia: string | undefined;
  let opciones: string[] | undefined;

  // Regex permisiva: captura con o sin etiqueta de cierre
  const guiaMatch = raw.match(/<GUIA>([\s\S]*?)(?:<\/GUIA>|$)/i);
  if (guiaMatch) {
    guia = guiaMatch[1].trim();
    respuesta = respuesta.replace(guiaMatch[0], "").trim();
  }

  const opcionesMatch = raw.match(/<OPCIONES>([\s\S]*?)(?:<\/OPCIONES>|$)/i);
  if (opcionesMatch) {
    opciones = opcionesMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\d+\.\s*/, "").trim())
      .filter(Boolean);
    respuesta = respuesta.replace(opcionesMatch[0], "").trim();
  }

  // Limpieza defensiva: cualquier etiqueta suelta que se haya escapado
  respuesta = respuesta
    .replace(/<\/?GUIA>/gi, "")
    .replace(/<\/?OPCIONES>/gi, "")
    .trim();

  // Fallback si el modelo dejó la respuesta vacía tras extraer bloques
  if (!respuesta) {
    respuesta = "¿Sí, dígame?";
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
