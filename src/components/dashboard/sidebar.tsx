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
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineaLogo } from "@/components/ui/logo";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  exact: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Resumen",
    items: [{ href: "/dashboard", label: "Inicio", icon: Home, exact: true }],
  },
  {
    label: "Resultados",
    items: [
      { href: "/dashboard/opportunities", label: "Oportunidades", icon: Target, exact: false },
      { href: "/dashboard/leads", label: "Contactos", icon: Users2, exact: false },
      { href: "/dashboard/google", label: "Google", icon: Search, exact: false },
      { href: "/dashboard/reports", label: "Informes", icon: FileBarChart2, exact: false },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      { href: "/dashboard/plan", label: "Plan de mejora", icon: ListChecks, exact: false },
      { href: "/dashboard/support", label: "Solicitudes", icon: LifeBuoy, exact: false },
    ],
  },
  {
    label: "Tu web",
    items: [{ href: "/dashboard/website", label: "Mi Web", icon: LayoutTemplate, exact: false }],
  },
  {
    label: "Cuenta",
    items: [{ href: "/dashboard/settings", label: "Configuración", icon: Settings, exact: false }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

const ADMIN_NAV_ITEM: NavItem = {
  href: "/dashboard/admin/sites",
  label: "Sitios (equipo)",
  icon: ShieldCheck,
  exact: false,
};

export function getNavItems(isStaff: boolean): NavItem[] {
  return isStaff ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
}

function getNavGroups(isStaff: boolean): NavGroup[] {
  return isStaff ? [...NAV_GROUPS, { label: "Equipo", items: [ADMIN_NAV_ITEM] }] : NAV_GROUPS;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
        isActive ? "bg-ink-900 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-secondary-500" />
      )}
      <Icon
        className={cn("h-4 w-4 transition-transform duration-200", !isActive && "group-hover:scale-110")}
        strokeWidth={2}
      />
      {item.label}
    </Link>
  );
}

export function Sidebar({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();
  const groups = getNavGroups(isStaff);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white/70 backdrop-blur-sm lg:flex">
      <div className="flex h-16 items-center px-6">
        <LineaLogo />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-4">
        <p className="text-[11px] leading-relaxed text-ink-400">
          Línea App · V0.1
          <br />
          Panel de gestión para negocios
        </p>
      </div>
    </aside>
  );
}
