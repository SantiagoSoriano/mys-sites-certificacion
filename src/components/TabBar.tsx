"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, GraduationCap, Info, Shield } from "lucide-react";
import type { ComponentType } from "react";

export type TabIconKey = "dashboard" | "curso" | "info" | "admin";

export type TabItem = {
  href: string;
  label: string;
  icon: TabIconKey;
  matchPrefix?: string;
};

const ICONS: Record<TabIconKey, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dashboard: LayoutDashboard,
  curso: GraduationCap,
  info: Info,
  admin: Shield,
};

type Props = { tabs: TabItem[] };

export default function TabBar({ tabs }: Props) {
  const pathname = usePathname();
  const routeActiveIndex = Math.max(
    tabs.findIndex(
      (t) =>
        pathname === t.href ||
        (t.matchPrefix && pathname.startsWith(`${t.matchPrefix}/`)) ||
        pathname === t.matchPrefix
    ),
    0
  );

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const focusIndex = hoveredIndex ?? routeActiveIndex;

  const tabPercent = 100 / tabs.length;
  const focusCenterPercent = tabPercent * focusIndex + tabPercent / 2;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="relative bg-cafe rounded-full shadow-lg"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Curved notch that follows the focused tab */}
        <div
          className="absolute top-0 h-full pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: `calc(${focusCenterPercent}% - 30px)`,
            width: "60px",
          }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 60 20"
            preserveAspectRatio="none"
            className="absolute -top-[1px] left-0 w-full h-5 text-crema"
            aria-hidden="true"
          >
            <path
              d="M0,0 C10,0 15,20 30,20 C45,20 50,0 60,0 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <ul className="relative flex items-stretch justify-between px-2">
          {tabs.map((tab, i) => {
            const isFocused = i === focusIndex;
            const Icon = ICONS[tab.icon];
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onFocus={() => setHoveredIndex(i)}
                  onBlur={() => setHoveredIndex(null)}
                  className="relative flex flex-col items-center justify-center h-16 outline-none"
                >
                  <span
                    className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isFocused ? "-translate-y-6" : "translate-y-0"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full transition-all duration-500 ${
                        isFocused
                          ? "w-12 h-12 bg-terracota text-crema shadow-md ring-4 ring-crema"
                          : "w-10 h-10 text-crema/80"
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </span>
                  </span>
                  <span
                    className={`absolute bottom-1.5 text-[10px] font-medium tracking-wide transition-opacity duration-300 ${
                      isFocused ? "opacity-0" : "opacity-70 text-crema"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs font-medium text-cafe/80 mt-2 uppercase tracking-widest">
        {tabs[focusIndex]?.label}
      </p>
    </div>
  );
}
