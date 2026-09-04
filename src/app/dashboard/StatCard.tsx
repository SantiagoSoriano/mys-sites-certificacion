import Link from "next/link";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent?: "terracota" | "verde" | "cafe";
};

const accents = {
  terracota: "text-terracota",
  verde: "text-verde",
  cafe: "text-cafe",
} as const;

export default function StatCard({
  label,
  value,
  hint,
  href,
  accent = "cafe",
}: Props) {
  const inner = (
    <div className="h-full rounded-2xl border border-border bg-white/60 p-5 space-y-1 hover:bg-white/80 transition">
      <p className="text-xs uppercase tracking-widest text-cafe/60 font-medium">
        {label}
      </p>
      <p className={`text-3xl font-semibold ${accents[accent]}`}>{value}</p>
      {hint && <p className="text-xs text-cafe/60">{hint}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}
