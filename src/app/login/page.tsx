import type { Metadata } from "next";
import { LineaLogo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Línea App",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafafa] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,theme(colors.ink.200)_1px,transparent_0)] [background-size:28px_28px] opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-200/40 blur-[110px]"
      />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <LineaLogo />
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-popover">
          <div className="mb-6 space-y-1">
            <h1 className="text-lg font-semibold text-ink-900">Accede a tu panel</h1>
            <p className="text-sm text-ink-500">
              Introduce tus credenciales para ver el estado de tu negocio.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} Línea Sur. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
