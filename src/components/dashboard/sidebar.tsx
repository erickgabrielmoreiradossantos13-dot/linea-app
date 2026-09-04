"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users2, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineaLogo } from "@/components/ui/logo";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/leads", label: "Leads", icon: Users2, exact: false },
  { href: "/dashboard/website", label: "Sitio web", icon: LayoutTemplate, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white/70 backdrop-blur-sm lg:flex">
      <div className="flex h-16 items-center px-6">
        <LineaLogo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-ink-900 text-white shadow-sm"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-4">
        <p className="text-[11px] leading-relaxed text-ink-400">
          Línea App · V0
          <br />
          Panel de gestión para negocios
        </p>
      </div>
    </aside>
  );
}
