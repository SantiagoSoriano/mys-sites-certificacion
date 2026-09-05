// Cliente HTTP para el Mapa de Prospectos (Flask + Turso en Render).
// Server-only. Autenticación por header X-Programa-Api-Key.
// Tolera cold starts de Render (~30-60s) con timeout largo + retry.

export type MapaProspect = {
  id: string; // place_id de Google
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  tipos: string | null;
  website: string | null;
  calidad_sitio: number | null;
  status: number;
};

function baseUrl(): string {
  const url = process.env.MAPA_PROSPECTOS_API_URL;
  if (!url) throw new Error("MAPA_PROSPECTOS_API_URL not set");
  return url.replace(/\/$/, "");
}

function apiKey(): string {
  const key = process.env.MAPA_PROSPECTOS_API_KEY;
  if (!key) throw new Error("MAPA_PROSPECTOS_API_KEY not set");
  return key;
}

function headers(): HeadersInit {
  return {
    "X-Programa-Api-Key": apiKey(),
    "Content-Type": "application/json",
  };
}

// Fetch con timeout + retry para cold starts de Render.
// Primer intento: 15s. Si falla, retry con 75s (Render puede tardar hasta 60s
// en despertar del sleep del free tier).
async function fetchMapa(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const attempts = [
    { timeoutMs: 15_000, label: "first" },
    { timeoutMs: 75_000, label: "cold_start_retry" },
  ];

  let lastError: unknown = null;
  for (const { timeoutMs } of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      return res;
    } catch (e: unknown) {
      clearTimeout(timer);
      lastError = e;
      // Solo reintenta si fue timeout/abort o network error
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("abort") && !msg.includes("fetch") && !msg.includes("network")) {
        break;
      }
    }
  }
  throw new Error(
    lastError instanceof Error
      ? `Mapa unreachable (probable cold start): ${lastError.message}`
      : "Mapa unreachable"
  );
}

export async function listMapaProspects(opts?: {
  limit?: number;
  giro?: string;
  ciudad?: string;
  sinSitioSolo?: boolean;
}): Promise<MapaProspect[]> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.giro) params.set("giro", opts.giro);
  if (opts?.ciudad) params.set("ciudad", opts.ciudad);
  if (opts?.sinSitioSolo) params.set("sin_sitio_solo", "1");

  const res = await fetchMapa(`${baseUrl()}/api/programa/prospects?${params}`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Mapa list failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as MapaProspect[];
}

export async function markMapaProspect(
  placeId: string,
  appProspectId: string
): Promise<void> {
  const res = await fetchMapa(`${baseUrl()}/api/programa/mark/${placeId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ app_prospect_id: appProspectId }),
  });
  if (!res.ok) {
    if (res.status === 409) {
      throw new Error("already_claimed_by_someone_else");
    }
    throw new Error(`Mapa mark failed: ${res.status} ${await res.text()}`);
  }
}

export async function releaseMapaProspect(placeId: string): Promise<void> {
  const res = await fetchMapa(`${baseUrl()}/api/programa/release/${placeId}`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Mapa release failed: ${res.status} ${await res.text()}`);
  }
}
