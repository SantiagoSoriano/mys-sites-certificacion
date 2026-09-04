// Fetches Puebla weather from wttr.in (no API key required).
// Cached por Next fetch cache — 1 hora.

type WttrCondition = {
  temp_C: string;
  weatherDesc: { value: string }[];
  FeelsLikeC: string;
};

type WttrResponse = {
  current_condition: WttrCondition[];
};

export type PueblaWeather = {
  tempC: number;
  desc: string;
  feelsLikeC: number;
} | null;

// Emoji picker basic — matches on English weatherDesc keywords
function pickEmoji(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("sun") || d.includes("clear")) return "☀️";
  if (d.includes("cloud") && d.includes("part")) return "⛅";
  if (d.includes("cloud")) return "☁️";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("storm") || d.includes("thunder")) return "⛈️";
  if (d.includes("snow")) return "❄️";
  if (d.includes("fog") || d.includes("mist")) return "🌫️";
  return "🌤️";
}

// Translate common English condition strings to Spanish (short set)
function toEs(desc: string): string {
  const map: Record<string, string> = {
    "Sunny": "Soleado",
    "Clear": "Despejado",
    "Partly cloudy": "Parcialmente nublado",
    "Cloudy": "Nublado",
    "Overcast": "Encapotado",
    "Mist": "Neblina",
    "Fog": "Niebla",
    "Patchy rain possible": "Posible lluvia",
    "Patchy rain nearby": "Lluvia cercana",
    "Light rain": "Lluvia ligera",
    "Moderate rain": "Lluvia moderada",
    "Heavy rain": "Lluvia fuerte",
    "Thundery outbreaks possible": "Posibles tormentas",
    "Thunderstorm": "Tormenta",
    "Light drizzle": "Llovizna",
  };
  return map[desc] ?? desc;
}

export async function getPueblaWeather(): Promise<{ emoji: string; text: string; tempC: number } | null> {
  try {
    const res = await fetch("https://wttr.in/Puebla?format=j1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as WttrResponse;
    const cond = data.current_condition?.[0];
    if (!cond) return null;
    const rawDesc = cond.weatherDesc?.[0]?.value ?? "";
    return {
      emoji: pickEmoji(rawDesc),
      text: toEs(rawDesc),
      tempC: parseInt(cond.temp_C, 10),
    };
  } catch {
    return null;
  }
}
