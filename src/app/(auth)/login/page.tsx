import Link from "next/link";
import {AuthLayout} from "@/components/auth-layout";
import {ActionForm} from "@/components/action-form";
import {isDemoMode} from "@/lib/env";
import {login,signup,recover} from "./actions";
export default async function LoginPage({searchParams}:{searchParams:Promise<{mode?:string;error?:string}>}){
 const {mode,error}=await searchParams; const register=mode==="register", recovery=mode==="recover";
 return <AuthLayout><div className="kicker">Línea App</div><h1>{recovery?"Recupera tu acceso":register?"Crea tu espacio":"Bienvenido de nuevo."}</h1><p>{recovery?"Te enviaremos un enlace a tu correo.":register?"Empieza a organizar tu negocio con Línea Sur.":"Accede a tu panel y sigue donde lo dejaste."}</p>
 {error&&<p className="form-status error" role="alert">El enlace no es válido o ha caducado. Inicia sesión o solicita otro.</p>}
 {!isDemoMode&&<><nav className="auth-tabs mt-6"><Link href="/login" aria-current={!register&&!recovery?"page":undefined}>Iniciar sesión</Link><Link href="/login?mode=register" aria-current={register?"page":undefined}>Crear cuenta</Link></nav><ActionForm action={recovery?recover:register?signup:login} className="space-y-5">{register&&<label className="block text-sm">Tu nombre<input className="input mt-2" name="name" autoComplete="name" minLength={2} maxLength={120} required/></label>}<label className="block text-sm">Email<input className="input mt-2" type="email" name="email" autoComplete="email" required placeholder="tu@empresa.com"/></label>{!recovery&&<label className="block text-sm">Contraseña<input className="input mt-2" type="password" name="password" minLength={register?10:undefined} maxLength={128} autoComplete={register?"new-password":"current-password"} required/>{register&&<small className="muted">Al menos 10 caracteres.</small>}</label>}<button className="btn btn-primary w-full">{recovery?"Enviar enlace":register?"Crear cuenta":"Entrar en mi espacio"}</button></ActionForm>{!register&&!recovery&&<Link className="block mt-5 text-sm muted" href="/login?mode=recover">¿Has olvidado tu contraseña?</Link>}</>}
 {isDemoMode&&<><Link className="btn btn-primary w-full mt-8" href="/dashboard">Explorar demostración</Link><p className="auth-footnote">Datos de ejemplo. No necesitas contraseña y no se guardan cambios.</p></>}
 <p className="auth-footnote">¿Necesitas ayuda? <a href="https://lineasur.online/contacto" target="_blank" rel="noreferrer" className="underline">Habla con Línea Sur</a>.</p></AuthLayout>;
}
