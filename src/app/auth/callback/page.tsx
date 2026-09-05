"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackLogin } from "@/lib/track-login";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Cargando…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const next = params.get("next") ?? "/dashboard";

  useEffect(() => {
    const supabase = createClient();

    const urlError = params.get("error") ?? params.get("error_description");
    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    (async () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hasHashToken = hash && hash.includes("access_token");
      const code = params.get("code");

      // Case A: implicit flow — Supabase JS con detectSessionInUrl:true
      // procesa el hash automáticamente al iniciar. Le damos un momento y
      // luego verificamos la sesión. Esto es lo esperado en nuestra config
      // actual (flowType: 'implicit' en el cliente).
      if (hasHashToken) {
        for (let i = 0; i < 20; i++) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            void trackLogin();
            router.replace(next);
            return;
          }
          await new Promise((r) => setTimeout(r, 150));
        }
        setError("no_session_from_hash");
        return;
      }

      // Case B: PKCE flow — hay ?code=. Solo intenta si NO hay hash
      // (evitamos el race del PKCE code verifier missing cuando en
      // realidad el flow venía por hash).
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Si falla, intenta detectar sesión del hash o storage por si
          // Supabase JS ya la había armado en paralelo.
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            void trackLogin();
            router.replace(next);
            return;
          }
          setError(`exchange_failed: ${error.message}`);
          return;
        }
        void trackLogin();
        router.replace(next);
        return;
      }

      // Fallback: quizás la sesión ya se armó sola (returning user con
      // cookies válidas). Chequea una vez más antes de rendirse.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        void trackLogin();
        router.replace(next);
        return;
      }

      setError("no_code_no_hash");
    })();
  }, [params, router, next]);

  if (error) {
    return (
      <CallbackShell message="Algo falló al iniciar sesión.">
        <p className="text-sm text-terracota-oscuro mt-2 break-all">{error}</p>
        <a
          href="/"
          className="inline-block mt-6 text-sm text-verde underline"
        >
          Volver a intentar
        </a>
      </CallbackShell>
    );
  }

  return <CallbackShell message="Entrando…" />;
}

function CallbackShell({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold text-cafe">{message}</h1>
        {children}
      </div>
    </main>
  );
}
