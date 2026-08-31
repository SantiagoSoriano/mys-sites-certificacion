"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    // Detect ?error=... in query (Google or Supabase rejected)
    const urlError = params.get("error") ?? params.get("error_description");
    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    (async () => {
      const code = params.get("code");

      // Case 1: PKCE flow — server-side code exchange happens here client-side too
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(`exchange_failed: ${error.message}`);
          return;
        }
        router.replace(next);
        return;
      }

      // Case 2: Implicit flow — tokens are in the URL hash.
      // Supabase JS with detectSessionInUrl: true reads them automatically
      // during client init. Wait a tick then verify.
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Give Supabase JS a moment to process the hash
        await new Promise((r) => setTimeout(r, 300));
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
          return;
        }
        setError("no_session_from_hash");
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
          href="/login"
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
