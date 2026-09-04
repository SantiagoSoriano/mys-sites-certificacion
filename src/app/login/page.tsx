"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRODUCTION_SITE_URL = "https://mys-sites-certificacion.vercel.app";

function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.startsWith("http://localhost")) return origin;
    if (origin === PRODUCTION_SITE_URL) return origin;
    return PRODUCTION_SITE_URL;
  }
  return PRODUCTION_SITE_URL;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const params = useSearchParams();
  const urlError = params.get("error");
  const urlDesc = params.get("desc") ?? params.get("error_description");

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const siteUrl = resolveSiteUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-[640px] aspect-[16/10] rounded-[32px] overflow-hidden bg-crema shadow-2xl border border-border select-none">
        {/* LEFT — brand always visible */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-terracota text-crema flex flex-col justify-center px-8 sm:px-10">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] opacity-70">
            Programa de certificación
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold mt-3 leading-none">
            MyS<br />Sites
          </h1>
          <p className="text-xs sm:text-sm mt-4 opacity-85 max-w-[190px] leading-relaxed">
            Aprende a vender sitios web de verdad.
          </p>
        </div>

        {/* RIGHT — Google button (revealed underneath) */}
        <div className="absolute inset-y-0 right-0 w-1/2 flex flex-col items-center justify-center gap-4 px-4 sm:px-6 text-center">
          <p className="text-xs text-cafe/70">
            Continúa con tu cuenta de Google
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cafe px-5 sm:px-6 py-3 text-crema text-sm font-medium hover:bg-cafe/90 disabled:opacity-60 transition"
          >
            <GoogleIcon />
            {loading ? "Redirigiendo…" : "Continuar con Google"}
          </button>
          {(error || urlError) && (
            <div className="text-xs text-terracota-oscuro max-w-[220px] space-y-1">
              <p className="font-medium">{error ?? `Error: ${urlError}`}</p>
              {urlDesc && (
                <p className="opacity-80 text-[10px] break-words">{urlDesc}</p>
              )}
            </div>
          )}
        </div>

        {/* FLAP — covers the right half, tilts to reveal the Google button */}
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={revealed}
          aria-label="Revelar botón para entrar"
          className={`absolute inset-y-0 right-0 w-1/2 bg-terracota-oscuro text-crema flex flex-col items-center justify-center gap-2 origin-bottom-right transition-all duration-[700ms] ease-out cursor-pointer group ${
            revealed
              ? "rotate-[14deg] translate-x-[85%] -translate-y-[6%] opacity-0 pointer-events-none"
              : "hover:rotate-[3deg] hover:translate-x-1"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-70">
            Toca para
          </p>
          <p className="text-3xl sm:text-4xl font-semibold">Entrar</p>
          <p className="text-2xl group-hover:translate-x-1 transition-transform">
            →
          </p>
        </button>
      </div>

      <p className="mt-8 text-xs text-cafe/60 text-center max-w-md">
        Solo entran los invitados al programa de certificación de MyS Sites.
      </p>

      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="mt-4 text-xs text-cafe/40 hover:text-cafe/70 transition"
        >
          ← Volver a cerrar
        </button>
      )}
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.7 34.5 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.4 39.5 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.9l6.6 5.6C41.6 36 44 30.6 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
