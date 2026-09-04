"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { demoSignOut } from "@/lib/demo/actions";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    if (IS_DEMO_MODE) {
      await demoSignOut();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:opacity-60"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
