"use client";

import { useMemo, useState } from "react";
import type {
  LeaderCertificado,
  LeaderEntrenamiento,
} from "@/lib/db/types";
import { pesos } from "@/lib/format";

type Tab = "entrenamiento" | "vendedores";
type SortMode = "ganancias" | "ventas";

type Props = {
  entrenamiento: LeaderEntrenamiento[];
  certificados: LeaderCertificado[];
  currentUserId: string;
};

export default function RankingTabs({
  entrenamiento,
  certificados,
  currentUserId,
}: Props) {
  const [tab, setTab] = useState<Tab>(
    certificados.length > 0 ? "vendedores" : "entrenamiento"
  );
  const [sortMode, setSortMode] = useState<SortMode>("ganancias");

  const sortedVendedores = useMemo(() => {
    const copy = [...certificados];
    if (sortMode === "ventas") {
      copy.sort(
        (a, b) => b.ventasCerradas - a.ventasCerradas || b.comisionTotal - a.comisionTotal
      );
    } else {
      copy.sort(
        (a, b) => b.comisionTotal - a.comisionTotal || b.ventasCerradas - a.ventasCerradas
      );
    }
    return copy.slice(0, 10);
  }, [certificados, sortMode]);

  const entrenamientoTop = useMemo(() => entrenamiento.slice(0, 10), [entrenamiento]);

  const activos = tab === "entrenamiento" ? entrenamientoTop : sortedVendedores;
  const top3 = activos.slice(0, 3);
  const resto = activos.slice(3);

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-border p-1 bg-white/40">
        <TabButton
          active={tab === "entrenamiento"}
          onClick={() => setTab("entrenamiento")}
          label="En entrenamiento"
          count={entrenamiento.length}
        />
        <TabButton
          active={tab === "vendedores"}
          onClick={() => setTab("vendedores")}
          label="Vendedores"
          count={certificados.length}
        />
      </div>

      {tab === "vendedores" && certificados.length > 0 && (
        <div className="inline-flex rounded-full border border-border p-1 bg-white/40 text-xs">
          <SortButton
            active={sortMode === "ganancias"}
            onClick={() => setSortMode("ganancias")}
            label="Por ganancias"
          />
          <SortButton
            active={sortMode === "ventas"}
            onClick={() => setSortMode("ventas")}
            label="Por ventas"
          />
        </div>
      )}

      {activos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white/40 p-10 text-center">
          <p className="text-4xl mb-2">
            {tab === "entrenamiento" ? "📚" : "🏆"}
          </p>
          <p className="text-sm text-cafe/70">
            {tab === "entrenamiento"
              ? "Nadie está en el curso todavía."
              : "Aún nadie ha cerrado su primera venta. Sé el primero."}
          </p>
        </div>
      ) : (
        <>
          <Podium
            tab={tab}
            sortMode={sortMode}
            top3={top3}
            currentUserId={currentUserId}
          />
          <RestList
            tab={tab}
            sortMode={sortMode}
            rows={resto}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
        active
          ? "bg-terracota text-crema shadow-sm"
          : "text-cafe/60 hover:text-cafe"
      }`}
    >
      {label} <span className="opacity-60">· {count}</span>
    </button>
  );
}

function SortButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full font-medium transition ${
        active
          ? "bg-verde text-crema shadow-sm"
          : "text-cafe/60 hover:text-cafe"
      }`}
    >
      {label}
    </button>
  );
}

function metricaSecundaria(
  row: LeaderEntrenamiento | LeaderCertificado,
  tab: Tab,
  sortMode: SortMode,
  isMe: boolean
) {
  if (tab === "entrenamiento") {
    return `Día ${(row as LeaderEntrenamiento).dia}/8`;
  }
  const v = row as LeaderCertificado;
  if (sortMode === "ventas") {
    return `${v.ventasCerradas} ${v.ventasCerradas === 1 ? "venta" : "ventas"}`;
  }
  // ganancias
  if (v.mostrarGanancias || isMe) return pesos(v.comisionTotal);
  return "🔒 privado";
}

function metricaPrincipal(
  row: LeaderEntrenamiento | LeaderCertificado,
  tab: Tab,
  sortMode: SortMode,
  isMe: boolean
) {
  if (tab === "entrenamiento") {
    const e = row as LeaderEntrenamiento;
    return e.scorePromedio !== null ? `${e.scorePromedio}/10` : "—";
  }
  const v = row as LeaderCertificado;
  if (sortMode === "ventas") {
    return `${v.ventasCerradas}`;
  }
  if (v.mostrarGanancias || isMe) return pesos(v.comisionTotal);
  return "🔒";
}

function Podium({
  tab,
  sortMode,
  top3,
  currentUserId,
}: {
  tab: Tab;
  sortMode: SortMode;
  top3: (LeaderEntrenamiento | LeaderCertificado)[];
  currentUserId: string;
}) {
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="pt-8 pb-4">
      <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-md mx-auto">
        {second ? (
          <PodiumColumn
            rank={2}
            row={second}
            tab={tab}
            sortMode={sortMode}
            height="h-28"
            avatarSize="w-16 h-16"
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1" />
        )}
        {first ? (
          <PodiumColumn
            rank={1}
            row={first}
            tab={tab}
            sortMode={sortMode}
            height="h-40"
            avatarSize="w-20 h-20"
            crown
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1" />
        )}
        {third ? (
          <PodiumColumn
            rank={3}
            row={third}
            tab={tab}
            sortMode={sortMode}
            height="h-20"
            avatarSize="w-14 h-14"
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

function PodiumColumn({
  rank,
  row,
  tab,
  sortMode,
  height,
  avatarSize,
  crown,
  currentUserId,
}: {
  rank: 1 | 2 | 3;
  row: LeaderEntrenamiento | LeaderCertificado;
  tab: Tab;
  sortMode: SortMode;
  height: string;
  avatarSize: string;
  crown?: boolean;
  currentUserId: string;
}) {
  const rankBg =
    rank === 1
      ? "bg-terracota"
      : rank === 2
      ? "bg-cafe/60"
      : "bg-cafe/40";
  const isMe = row.id === currentUserId;

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      {crown && (
        <div className="text-3xl mb-1 animate-bounce" aria-hidden="true">
          👑
        </div>
      )}
      <Avatar
        nombre={row.nombre}
        size={avatarSize}
        highlight={rank === 1 ? "terracota" : "cafe"}
        isMe={isMe}
      />
      <p className="text-xs font-semibold text-cafe mt-2 text-center truncate max-w-full px-1">
        {row.nombre}
      </p>
      <p className="text-[10px] text-cafe/60 text-center truncate max-w-full px-1">
        {metricaSecundaria(row, tab, sortMode, isMe)}
      </p>
      <div
        className={`${rankBg} ${height} w-full mt-2 rounded-t-2xl flex items-start justify-center pt-3 shadow-inner`}
      >
        <span className="text-4xl font-bold text-crema">{rank}</span>
      </div>
    </div>
  );
}

function Avatar({
  nombre,
  size,
  highlight,
  isMe,
}: {
  nombre: string;
  size: string;
  highlight: "terracota" | "cafe";
  isMe?: boolean;
}) {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";
  const bg = highlight === "terracota" ? "bg-terracota" : "bg-cafe";
  const ringColor = isMe ? "ring-verde" : "ring-crema";
  return (
    <div
      className={`${size} ${bg} rounded-full flex items-center justify-center text-crema font-semibold ring-4 ${ringColor} shadow-lg relative`}
    >
      <span className={size.includes("20") ? "text-2xl" : "text-lg"}>
        {inicial}
      </span>
      {isMe && (
        <span className="absolute -bottom-1 -right-1 bg-verde text-crema text-[8px] px-1.5 py-0.5 rounded-full font-medium">
          tú
        </span>
      )}
    </div>
  );
}

function RestList({
  tab,
  sortMode,
  rows,
  currentUserId,
}: {
  tab: Tab;
  sortMode: SortMode;
  rows: (LeaderEntrenamiento | LeaderCertificado)[];
  currentUserId: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-white/60 overflow-hidden">
      <ol>
        {rows.map((row, i) => {
          const rank = i + 4;
          const isMe = row.id === currentUserId;
          const inicial = row.nombre.trim().charAt(0).toUpperCase() || "?";
          return (
            <li
              key={row.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 ${
                isMe ? "bg-terracota/5" : ""
              }`}
            >
              <span className="text-cafe/60 font-medium w-6 text-right text-sm">
                {rank}
              </span>
              <div className="w-10 h-10 bg-cafe/20 rounded-full flex items-center justify-center text-cafe font-semibold">
                {inicial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cafe truncate">
                  {row.nombre}
                  {isMe && (
                    <span className="text-[10px] text-terracota ml-2">
                      (tú)
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-cafe/60">
                  {metricaSecundaria(row, tab, sortMode, isMe)}
                </p>
              </div>
              <span className="text-sm font-semibold text-terracota">
                {metricaPrincipal(row, tab, sortMode, isMe)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
