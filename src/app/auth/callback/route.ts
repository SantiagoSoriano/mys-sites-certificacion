import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (errorParam) {
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", errorParam);
    if (errorDescription) target.searchParams.set("desc", errorDescription);
    return NextResponse.redirect(target);
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", url.origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "exchange_failed");
    target.searchParams.set("desc", error.message);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
