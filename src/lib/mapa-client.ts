// Cliente HTTP para el Mapa de Prospectos (Flask + Turso en Render).
// Server-only. Autenticación por header X-Programa-Api-Key.

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

  const res = await fetch(`${baseUrl()}/api/programa/prospects?${params}`, {
    headers: headers(),
    cache: "no-store",
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
  const res = await fetch(`${baseUrl()}/api/programa/mark/${placeId}`, {
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
  const res = await fetch(`${baseUrl()}/api/programa/release/${placeId}`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Mapa release failed: ${res.status} ${await res.text()}`);
  }
}
