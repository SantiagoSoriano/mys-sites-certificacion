"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MapaProspect } from "@/lib/mapa-client";

type Props = {
  prospects: MapaProspect[];
  slotsLibres: number;
};

export default function MapaVendedor({ prospects, slotsLibres }: Props) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [selected, setSelected] = useState<MapaProspect | null>(null);
  const [reclamando, setReclamando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Cargar Leaflet + markercluster dinámicamente para evitar SSR issues
    let cancelled = false;
    (async () => {
      const [{ default: L }] = await Promise.all([
        import("leaflet"),
        import("leaflet.markercluster"),
      ]);
      // CSS de Leaflet + markercluster (inject en runtime)
      injectCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      injectCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
      injectCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");

      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [19.0413, -98.2062], // Puebla
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

      cluster.addLayers(markers);
      map.addLayer(cluster);
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove?.();
        mapRef.current = null;
      }
    };
  }, [prospects]);

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
        setSelected(null);
        router.push("/prospectos");
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
        className="rounded-2xl border border-border overflow-hidden bg-white/60"
        style={{ height: "500px" }}
      />
      {!ready && (
        <p className="text-xs text-cafe/60 text-center">
          Cargando mapa…
        </p>
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
  if (calidad === 0 || !website) return "#22c55e"; // verde — sin sitio
  if (calidad === 1) return "#f97316"; // naranja — casi no existe
  if (calidad === 2) return "#eab308"; // amarillo — mejorable
  if (calidad === 3) return "#6b7280"; // gris — buen sitio, difícil
  return "#3b82f6"; // azul — sin revisar
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
