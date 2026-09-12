import Link from "next/link";
export default function NotFound(){return <div className="mx-auto mt-16 max-w-lg panel empty-state"><span className="kicker">404</span><h1 className="text-2xl">Esta página no está disponible</h1><p>Puede que el enlace haya cambiado o que no tengas acceso a este contenido.</p><Link className="btn btn-primary" href="/dashboard">Ir al resumen</Link></div>;}
