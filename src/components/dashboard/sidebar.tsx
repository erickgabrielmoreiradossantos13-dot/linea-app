"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  Users2,
  Search,
  LayoutTemplate,
  ListChecks,
  FileBarChart2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineaLogo } from "@/components/ui/logo";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home, exact: true },
  { href: "/dashboard/opportunities", label: "Oportunidades", icon: Target, exact: false },
  { href: "/dashboard/leads", label: "Contactos", icon: Users2, exact: false },
  { href: "/dashboard/google", label: "Google", icon: Search, exact: false },
  { href: "/dashboard/website", label: "Web", icon: LayoutTemplate, exact: false },
  { href: "/dashboard/plan", label: "Plan de mejora", icon: ListChecks, exact: false },
  { href: "/dashboard/reports", label: "Informes", icon: FileBarChart2, exact: false },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings, exact: false },
];

const ADMIN_NAV_ITEM = {
  href: "/dashboard/admin/sites",
  label: "Sitios (equipo)",
  icon: ShieldCheck,
  exact: false,
};

export function getNavItems(isStaff: boolean) {
  return isStaff ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
}

export function Sidebar({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();
  const items = getNavItems(isStaff);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white/70 backdrop-blur-sm lg:flex">
      <div className="flex h-16 items-center px-6">
        <LineaLogo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-ink-900 text-white shadow-sm"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-secondary-500" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )}
                strokeWidth={2}
              />
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
