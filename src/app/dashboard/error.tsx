"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm font-medium text-ink-700">
        No hemos podido cargar los datos en este momento.
      </p>
      <p className="mt-1 max-w-sm text-sm text-ink-400">
        Puede ser un problema temporal de conexión. Inténtalo de nuevo en unos segundos.
      </p>
      <Button className="mt-5" onClick={() => reset()}>
        Volver a intentar
      </Button>
    </div>
  );
}
