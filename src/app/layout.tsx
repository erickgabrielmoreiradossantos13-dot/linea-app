import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Línea App",
  description: "Painel comercial da sua presença digital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
