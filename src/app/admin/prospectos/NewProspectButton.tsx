"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function NewProspectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    negocio: "",
    contacto_nombre: "",
    contacto_tel: "",
    contacto_email: "",
    giro: "",
    ciudad: "Puebla",
  });
  const [, startTransition] = useTransition();

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prospects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setOpen(false);
        setForm({
          negocio: "",
          contacto_nombre: "",
          contacto_tel: "",
          contacto_email: "",
          giro: "",
          ciudad: "Puebla",
        });
        startTransition(() => router.refresh());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "network");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-terracota text-crema px-4 py-2 text-sm font-medium hover:bg-terracota-oscuro transition"
      >
        + Nuevo prospecto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-cafe/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-crema border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xl font-semibold text-cafe">Nuevo prospecto</h4>

            <Field
              label="Negocio *"
              value={form.negocio}
              onChange={(v) => setForm({ ...form, negocio: v })}
              placeholder="Ej: Taquería Doña Chelo"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Giro"
                value={form.giro}
                onChange={(v) => setForm({ ...form, giro: v })}
                placeholder="Ej: taquería"
              />
              <Field
                label="Ciudad"
                value={form.ciudad}
                onChange={(v) => setForm({ ...form, ciudad: v })}
              />
            </div>
            <Field
              label="Nombre del contacto"
              value={form.contacto_nombre}
              onChange={(v) => setForm({ ...form, contacto_nombre: v })}
              placeholder="Ej: Doña Chelo"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Teléfono"
                value={form.contacto_tel}
                onChange={(v) => setForm({ ...form, contacto_tel: v })}
                placeholder="55 1234 5678"
              />
              <Field
                label="Email"
                value={form.contacto_email}
                onChange={(v) => setForm({ ...form, contacto_email: v })}
                placeholder="opcional"
              />
            </div>

            {error && (
              <p className="text-sm text-terracota-oscuro">Error: {error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-full border border-border text-cafe px-4 py-2 text-sm hover:bg-white/60 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={loading || form.negocio.trim().length < 2}
                className="flex-1 rounded-full bg-terracota text-crema px-4 py-2 text-sm font-medium hover:bg-terracota-oscuro disabled:opacity-40 transition"
              >
                {loading ? "Creando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-cafe/70">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-terracota"
      />
    </label>
  );
}
