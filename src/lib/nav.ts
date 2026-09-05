import type { TabItem } from "@/components/TabBar";

export function buildTabs(rol: "vendedor" | "admin"): TabItem[] {
  const base: TabItem[] = [
    { href: "/dashboard", label: "Panel", icon: "dashboard", matchPrefix: "/dashboard" },
    { href: "/curso", label: "Curso", icon: "curso", matchPrefix: "/curso" },
    { href: "/ranking", label: "Ranking", icon: "ranking", matchPrefix: "/ranking" },
    { href: "/info", label: "Info", icon: "info", matchPrefix: "/info" },
  ];
  if (rol === "admin") {
    base.push({ href: "/admin", label: "Admin", icon: "admin", matchPrefix: "/admin" });
  }
  return base;
}
