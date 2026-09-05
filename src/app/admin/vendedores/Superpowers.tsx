"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Action = "certify" | "uncertify" | "advance_day" | "reset_day" | "archive";

type Props = {
  userId: string;
  userName: string;
  isCertified: boolean;
  currentDay: number;
  archived: boolean;
};

const CONFIRM: Record<Action, string> = {
  certify: "certificar",
  uncertify: "quitar certificación",
  advance_day: "adelantar día",
  reset_day: "resetear a día 1",
  archive: "archivar",
};

export default function Superpowers({
  userId,
  userName,
  isCertified,
  currentDay,
  archived,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function fire(action: Action) {
    if (!confirm(`¿Confirmas ${CONFIRM[action]} a ${userName}?`)) return;
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/superpowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        startTransition(() => router.refresh());
        setOpen(false);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-terracota hover:underline"
      >
        Poderes
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 z-50 w-52 rounded-xl border border-border bg-crema shadow-xl overflow-hidden">
            <MenuItem
              disabled={isCertified || loading !== null}
              loading={loading === "certify"}
              onClick={() => fire("certify")}
              label="Certificar ahora"
            />
            <MenuItem
              disabled={!isCertified || loading !== null}
              loading={loading === "uncertify"}
              onClick={() => fire("uncertify")}
              label="Quitar certificación"
            />
            <MenuItem
              disabled={currentDay >= 8 || loading !== null}
              loading={loading === "advance_day"}
              onClick={() => fire("advance_day")}
              label={`Adelantar día (→${Math.min(8, currentDay + 1)})`}
            />
            <MenuItem
              disabled={loading !== null}
              loading={loading === "reset_day"}
              onClick={() => fire("reset_day")}
              label="Resetear a día 1"
            />
            <MenuItem
              disabled={archived || loading !== null}
              loading={loading === "archive"}
              onClick={() => fire("archive")}
              label="Archivar curso"
              danger
            />
            {error && (
              <p className="text-[10px] text-terracota-oscuro px-3 py-2 border-t border-border">
                Error: {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
  loading,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`block w-full text-left text-xs px-3 py-2 transition ${
        disabled
          ? "text-cafe/30 cursor-not-allowed"
          : danger
          ? "text-terracota-oscuro hover:bg-terracota/10"
          : "text-cafe hover:bg-white/60"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
