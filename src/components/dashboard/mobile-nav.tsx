"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineaMark } from "@/components/ui/logo";
import { getNavItems } from "./sidebar";

export function MobileNav({ isStaff }: { isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = getNavItems(isStaff);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-carbon-700 bg-carbon-900 text-carbon-300"
        aria-label="Abrir menú"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-72 flex-col bg-carbon-950 shadow-popover">
            <div className="flex h-16 items-center justify-between px-5">
              <div className="flex items-center gap-2.5">
                <LineaMark />
                <span className="text-[15px] font-semibold tracking-tight text-carbon-50">Línea App</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-carbon-400 hover:bg-carbon-800"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </button>
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-500/15 text-brand-400"
                        : "text-carbon-300 hover:bg-carbon-800 hover:text-carbon-50"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
