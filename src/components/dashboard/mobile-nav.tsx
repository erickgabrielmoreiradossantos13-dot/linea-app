"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineaLogo } from "@/components/ui/logo";
import { NAV_ITEMS } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600"
        aria-label="Abrir menú"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-72 flex-col bg-white shadow-popover">
            <div className="flex h-16 items-center justify-between px-5">
              <LineaLogo />
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </button>
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-ink-900 text-white"
                        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
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
