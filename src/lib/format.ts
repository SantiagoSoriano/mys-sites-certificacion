// Formatters client-safe (no dependen de next/headers ni server-only APIs).

export function pesos(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
