import { LogOut } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { exitBusinessViewAction } from "@/app/dashboard/admin/sites/actions";

interface TopbarProps {
  businessName: string;
  userEmail: string | null;
  isStaff: boolean;
  isViewingAsStaff?: boolean;
}

export function Topbar({ businessName, userEmail, isStaff, isViewingAsStaff }: TopbarProps) {
  return (
    <>
      {isViewingAsStaff && (
        <div className="flex h-9 items-center justify-center gap-2 bg-brand-500 px-4 text-xs font-medium text-white">
          Estás viendo el proyecto de <strong>{businessName}</strong> como equipo Línea Sur.
          <form action={exitBusinessViewAction}>
            <button type="submit" className="inline-flex items-center gap-1 underline underline-offset-2">
              Salir
              <LogOut className="size-3" />
            </button>
          </form>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-carbon-800 bg-carbon-950/90 px-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3">
          <MobileNav isStaff={isStaff} />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-carbon-100">{businessName}</p>
            <p className="text-xs text-carbon-400">{userEmail}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-400">
            {businessName.slice(0, 1).toUpperCase()}
          </div>
          <LogoutButton />
        </div>
      </header>
    </>
  );
}
