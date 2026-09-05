// Client-side helper: fetches geo from ipapi.co and posts it to our
// /api/track-login endpoint. Runs after a successful OAuth callback.
// Fire-and-forget — never blocks navigation to /dashboard.

export async function trackLogin() {
  try {
    // ipapi.co free tier — no API key needed
    const geoRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    let payload: Record<string, string | null> = {};
    if (geoRes.ok) {
      const geo = (await geoRes.json()) as {
        ip?: string;
        city?: string;
        country_name?: string;
      };
      payload = {
        ip: geo.ip ?? null,
        city: geo.city ?? null,
        country: geo.country_name ?? null,
      };
    }
    await fetch("/api/track-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent — never break login on tracking failure
  }
}
