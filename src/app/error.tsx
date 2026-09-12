"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{reset:()=>void}) {
  return <section className="panel empty-state"><h1 className="text-2xl">No pudimos completar la operación</h1><p>Comprueba tu conexión y vuelve a intentarlo. Si el problema continúa, contacta con tu equipo Línea Sur.</p><button className="btn btn-primary" onClick={reset}>Volver a intentar</button><Link href="/dashboard" className="btn">Volver al resumen</Link></section>;
}
