"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const params = useSearchParams();
  const urlError = params.get("error");
  const urlDesc = params.get("desc") ?? params.get("error_description");

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    setDebugUrl(null);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data?.url) {
      setDebugUrl(data.url);
      setLoading(false);
      return;
    }
    setError("no_url_returned");
    setLoading(false);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/60 backdrop-blur rounded-2xl border border-border p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">
            <span className="text-terracota">MyS</span>{" "}
            <span className="text-cafe">Sites</span>
          </h1>
          <p className="text-cafe/70 text-sm">
            Entra con tu cuenta de Google para acceder al programa.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-cafe px-6 py-3 text-crema font-medium hover:bg-cafe/90 disabled:opacity-60 transition"
        >
          <GoogleIcon />
          {loading ? "Cargando…" : "Continuar con Google"}
        </button>

        {(error || urlError) && (
          <div className="text-sm text-terracota-oscuro text-center space-y-1">
            <p className="font-medium">{error ?? `Error: ${urlError}`}</p>
            {urlDesc && <p className="text-xs opacity-80">{urlDesc}</p>}
          </div>
        )}

        {debugUrl && (
          <div className="text-xs space-y-2 border-t border-border pt-4">
            <p className="font-medium text-cafe">Debug URL generada:</p>
            <textarea
              readOnly
              value={debugUrl}
              className="w-full h-32 p-2 rounded border border-border font-mono text-[10px] bg-white/60"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(debugUrl)}
                className="text-xs text-verde underline"
              >
                Copiar
              </button>
              <a href={debugUrl} className="text-xs text-verde underline">
                Ir a esa URL
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.7 34.5 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.4 39.5 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.9l6.6 5.6C41.6 36 44 30.6 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
