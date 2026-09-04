import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";

interface TopbarProps {
  businessName: string;
  userEmail: string | null;
}

export function Topbar({ businessName, userEmail }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-100 bg-[#fafafa]/80 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink-800">{businessName}</p>
          <p className="text-xs text-ink-400">{userEmail}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {businessName.slice(0, 1).toUpperCase()}
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
