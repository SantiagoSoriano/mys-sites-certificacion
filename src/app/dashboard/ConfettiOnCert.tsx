"use client";

import { useEffect } from "react";
import { celebrar } from "@/lib/confetti";

const KEY = "mys_cert_confetti_shown";

/**
 * Renders nothing. Fires confetti once the first time a certified user
 * lands on the dashboard, then remembers via localStorage so it doesn't
 * repeat on every visit.
 */
export default function ConfettiOnCert({ certificado }: { certificado: boolean }) {
  useEffect(() => {
    if (!certificado) return;
    try {
      if (localStorage.getItem(KEY) === "1") return;
      localStorage.setItem(KEY, "1");
    } catch {
      /* if storage unavailable, celebrate anyway */
    }
    // Small delay so the page has painted first
    const t = setTimeout(() => celebrar(), 400);
    return () => clearTimeout(t);
  }, [certificado]);

  return null;
}
