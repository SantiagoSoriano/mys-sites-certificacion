"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MapaProspect } from "@/lib/mapa-client";

type LoadState =
  | { fase: "conectando"; startedAt: number }
  | { fase: "despertando"; startedAt: number; segundos: number }
  | { fase: "listo"; prospects: MapaProspect[] }
  | { fase: "error"; mensaje: string };

type Props = {
  slotsLibres: number;
};

export default function MapaVendedor({ slotsLibres }: Props) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({
    fase: "conectando",
    startedAt: Date.now(),
  });
  const [selected, setSelected] = useState<MapaProspect | null>(null);
  const [reclamando, setReclamando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar prospects — si el server responde 503 (cold start), reintenta
  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      const startedAt = Date.now();
      setState({ fase: "conectando", startedAt });

      // Tick para actualizar contador de segundos si entramos en modo despertando
      let tickInterval: ReturnType<typeof setInterval> | null = null;

      try {
        // Primer intento — timeout corto
        const primero = await intentar(6_000);
        if (primero) {
          if (cancelled) return;
          setState({ fase: "listo", prospects: primero });
          return;
        }

        // Entramos en modo despertando
        if (cancelled) return;
        setState({ fase: "despertando", startedAt, segundos: 0 });
        tickInterval = setInterval(() => {
          setState((prev) => {
            if (prev.fase !== "despertando") return prev;
            const secs = Math.floor((Date.now() - startedAt) / 1000);
            return { ...prev, segundos: secs };
          });
        }, 500);

        // Segundo intento con timeout largo — Vercel maxDuration = 90s
        const segundo = await intentar(85_000);
        if (tickInterval) clearInterval(tickInterval);
        if (cancelled) return;
        if (segundo) {
          setState({ fase: "listo", prospects: segundo });
        } else {
          setState({
            fase: "error",
            mensaje:
              "El mapa está tardando más de lo normal. Espera 30 segundos y refresca esta página.",
          });
        }
      } catch (e: unknown) {
        if (tickInterval) clearInterval(tickInterval);
        if (cancelled) return;
        setState({
          fase: "error",
          mensaje: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    }

    async function intentar(timeoutMs: number): Promise<MapaProspect[] | null> {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch("/api/mapa/prospects?limit=500", {
          signal: ctrl.signal,
          cache: "no-store",
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = (await res.json()) as {
            ok: boolean;
            prospects: MapaProspect[];
          };
          return data.prospects;
        }
        // 503 = cold start — le dejamos reintentar
        if (res.status === 503) return null;
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      } catch (e: unknown) {
        clearTimeout(timer);
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("abort")) return null;
        throw e;
      }
    }

    cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.fase !== "listo") {
    return <LoadingCard state={state} />;
  }

  return (
    <MapView
      prospects={state.prospects}
      slotsLibres={slotsLibres}
      selected={selected}
      setSelected={setSelected}
      reclamando={reclamando}
      setReclamando={setReclamando}
      error={error}
      setError={setError}
      onReclamado={() => {
        setSelected(null);
        router.push("/prospectos");
      }}
    />
  );
}

function LoadingCard({ state }: { state: LoadState }) {
  const despertando = state.fase === "despertando";
  const errorState = state.fase === "error";
  // Barra de progreso: mientras despierta va del 10% al 90% en los primeros 60s
  const pct = despertando
    ? Math.min(90, 10 + (state.segundos / 60) * 80)
    : 15;

  if (errorState) {
    return (
      <div className="rounded-2xl border border-border bg-white/60 p-6 space-y-3">
        <p className="text-lg font-semibold text-cafe">
          🕐 Algo tardó demasiado
        </p>
        <p className="text-sm text-cafe/75">{state.mensaje}</p>
        <a
          href="/mapa"
          className="inline-block bg-terracota text-crema px-5 py-2 rounded-full text-sm font-medium hover:bg-terracota-oscuro transition"
        >
          Reintentar
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white/60 p-8 text-center space-y-5">
      <div className="text-4xl">🗺️</div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-cafe">
          {despertando ? "Prendiendo el mapa…" : "Conectando al mapa…"}
        </p>
        <p className="text-sm text-cafe/70 max-w-md mx-auto">
          {despertando
            ? "El mapa se apaga solo cuando nadie lo usa (para ahorrar). Aguanta unos segundos, ya viene."
            : "Cargando los negocios de Puebla."}
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <div className="w-full h-2 rounded-full bg-cafe/10 overflow-hidden">
          <div
            className="h-full bg-terracota transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {despertando && (
          <p className="text-xs text-cafe/60">
            Llevamos <strong>{state.segundos}s</strong> · normalmente tarda entre
            30 y 60 segundos la primera vez del día
          </p>
        )}
      </div>
    </div>
  );
}

function MapView({
  prospects,
  slotsLibres,
  selected,
  setSelected,
  reclamando,
  setReclamando,
  error,
  setError,
  onReclamado,
}: {
  prospects: MapaProspect[];
  slotsLibres: number;
  selected: MapaProspect | null;
  setSelected: (p: MapaProspect | null) => void;
  reclamando: boolean;
  setReclamando: (b: boolean) => void;
  error: string | null;
  setError: (s: string | null) => void;
  onReclamado: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);

  const [mapaError, setMapaError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        console.log("[mapa] init: importando Leaflet…");
        const [{ default: L }] = await Promise.all([
          import("leaflet"),
          import("leaflet.markercluster"),
        ]);
        console.log("[mapa] Leaflet OK, inyectando CSS");
        injectCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        injectCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
        injectCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");

        if (cancelled || !mapContainerRef.current) return;

        // Asegurar que el container tiene tamaño antes de crear el mapa
        const container = mapContainerRef.current;
        console.log("[mapa] container size:", container.clientWidth, "x", container.clientHeight);

        const map = L.map(container, {
          center: [19.0413, -98.2062],
          zoom: 12,
          zoomControl: true,
          preferCanvas: true,
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap · CARTO",
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(map);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cluster = (L as any).markerClusterGroup({
          disableClusteringAtZoom: 17,
          chunkedLoading: true,
          maxClusterRadius: 60,
          showCoverageOnHover: false,
        });

        const markers = prospects
          .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
          .map((p) => {
            const color = colorPorCalidad(p.calidad_sitio, p.website);
            const icon = L.divIcon({
              className: "",
              html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });
            const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(
              `<div style="font-family:-apple-system,sans-serif;">
                <div style="font-weight:600;font-size:13px;">${escapeHtml(p.nombre)}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:2px;">${escapeHtml(p.direccion || "")}</div>
                ${p.telefono ? `<div style="font-size:12px;color:#2563eb;margin-top:2px;">${escapeHtml(p.telefono)}</div>` : ""}
                <div style="font-size:11px;color:#9ca3af;margin-top:4px;">${calidadLabel(p.calidad_sitio, p.website)}</div>
              </div>`,
              { maxWidth: 220 }
            );
            marker.on("click", () => setSelected(p));
            return marker;
          });

        console.log(`[mapa] agregando ${markers.length} markers al cluster`);
        cluster.addLayers(markers);
        map.addLayer(cluster);
        mapRef.current = map;

        // Fix clásico de Leaflet: si el container se creó en un layout que
        // aún no había calculado dimensiones, invalidateSize fuerza el
        // recálculo. Ejecutamos en un rAF + timeout para máxima seguridad.
        requestAnimationFrame(() => {
          if (!cancelled && mapRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mapRef.current as any).invalidateSize?.();
          }
        });
        setTimeout(() => {
          if (!cancelled && mapRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mapRef.current as any).invalidateSize?.();
          }
        }, 250);

        console.log("[mapa] listo");
        setReady(true);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[mapa] init failed:", e);
        if (!cancelled) setMapaError(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove?.();
        mapRef.current = null;
      }
    };
  }, [prospects, setSelected]);

  // Re-invalidate size si la ventana cambia de tamaño (fix zoom bug en desktop)
  useEffect(() => {
    function onResize() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any)?.invalidateSize?.();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function reclamar() {
    if (!selected || reclamando || slotsLibres <= 0) return;
    setReclamando(true);
    setError(null);
    try {
      const res = await fetch("/api/vendedor/reclamar-mapa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "already_claimed_by_someone_else") {
          setError("Alguien más lo reclamó antes que tú. Refresca el mapa.");
        } else if (data.error === "slots_llenos") {
          setError("Ya tienes 5 prospectos activos — cierra alguno primero.");
        } else {
          setError(data.error ?? `HTTP ${res.status}`);
        }
      } else {
        onReclamado();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setReclamando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={mapContainerRef}
        className="rounded-2xl border border-border overflow-hidden bg-cafe/5"
        style={{ height: "500px", minHeight: "500px", width: "100%" }}
      />
      {mapaError && (
        <div className="rounded-lg border border-border bg-terracota/10 p-3 text-sm text-terracota-oscuro">
          <p className="font-medium">Error al dibujar el mapa</p>
          <p className="text-xs mt-1">{mapaError}</p>
          <p className="text-xs mt-2 text-cafe/70">
            Abre la consola del navegador (F12) para más detalle.
          </p>
        </div>
      )}
      {!ready && !mapaError && (
        <p className="text-xs text-cafe/60 text-center">Dibujando el mapa…</p>
      )}
      <p className="text-xs text-cafe/60 text-center">
        {prospects.length} prospectos disponibles. Los verdes no tienen sitio (mejores).
      </p>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-cafe/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => !reclamando && setSelected(null)}
        >
          <div
            className="bg-crema border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-terracota font-medium">
                Prospecto
              </p>
              <h4 className="text-xl font-semibold text-cafe mt-1">
                {selected.nombre}
              </h4>
              {selected.direccion && (
                <p className="text-sm text-cafe/70 mt-1">{selected.direccion}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-cafe/85">
              <div>
                <strong className="text-cafe">Giro:</strong>{" "}
                {selected.tipos ? selected.tipos.split(",")[0].trim() : "—"}
              </div>
              <div>
                <strong className="text-cafe">Rating:</strong>{" "}
                {selected.rating ? `⭐ ${selected.rating.toFixed(1)}` : "—"}
              </div>
              <div>
                <strong className="text-cafe">Sitio:</strong>{" "}
                {calidadLabel(selected.calidad_sitio, selected.website)}
              </div>
              <div>
                <strong className="text-cafe">Teléfono:</strong>{" "}
                {selected.telefono || "—"}
              </div>
            </div>

            {error && (
              <p className="text-sm text-terracota-oscuro">Error: {error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelected(null)}
                disabled={reclamando}
                className="flex-1 rounded-full border border-border text-cafe px-4 py-2 text-sm hover:bg-white/60 transition disabled:opacity-60"
              >
                Cerrar
              </button>
              <button
                onClick={reclamar}
                disabled={reclamando || slotsLibres <= 0}
                className="flex-1 rounded-full bg-terracota text-crema px-4 py-2 text-sm font-medium hover:bg-terracota-oscuro disabled:opacity-40 transition"
              >
                {reclamando
                  ? "Reclamando…"
                  : slotsLibres <= 0
                  ? "Sin slots libres"
                  : "Reclamar (usa 1 slot)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function colorPorCalidad(calidad: number | null, website: string | null): string {
  if (calidad === 0 || !website) return "#22c55e";
  if (calidad === 1) return "#f97316";
  if (calidad === 2) return "#eab308";
  if (calidad === 3) return "#6b7280";
  return "#3b82f6";
}

function calidadLabel(calidad: number | null, website: string | null): string {
  if (calidad === 0 || !website) return "Sin sitio web (jugoso)";
  if (calidad === 1) return "Casi no existe";
  if (calidad === 2) return "Mejorable";
  if (calidad === 3) return "Ya tiene buen sitio";
  return "Sin revisar";
}

function injectCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
