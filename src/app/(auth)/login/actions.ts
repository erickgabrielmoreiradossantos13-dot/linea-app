"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env,isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function login(data:FormData){
 if(isDemoMode)return {error:"La demo no requiere contraseña. Usa el acceso de demostración."};
 const email=String(data.get("email")??"").trim(),password=String(data.get("password")??"");
 if(!email||!password)return {error:"Introduce tu email y contraseña."};
 const supabase=await createSupabaseServerClient();
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)return {error:"No pudimos iniciar sesión. Revisa tus datos y confirma tu email si acabas de registrarte."};
 redirect("/dashboard");
}
export async function signup(data:FormData){
 if(isDemoMode)return {error:"El registro estará disponible al conectar la base de datos."};
 const parsed=z.object({email:z.email(),password:z.string().min(10).max(128),name:z.string().trim().min(2).max(120)}).safeParse({email:String(data.get("email")??"").trim(),password:data.get("password"),name:data.get("name")});
 if(!parsed.success)return {error:"Revisa el nombre, el email y una contraseña de al menos 10 caracteres."};
 const supabase=await createSupabaseServerClient();
 const {data:result,error}=await supabase.auth.signUp({email:parsed.data.email,password:parsed.data.password,options:{data:{full_name:parsed.data.name},emailRedirectTo:env.NEXT_PUBLIC_APP_URL+"/auth/callback"}});
 if(error)return {error:"No pudimos crear la cuenta. Comprueba tus datos o inténtalo más tarde."};
 if(result.session)redirect("/onboarding");
 return {success:"Revisa tu correo y confirma tu cuenta. Después podrás iniciar sesión."};
}
export async function recover(data:FormData){
 if(isDemoMode)return {error:"La demo no tiene cuentas de usuario."};
 const email=String(data.get("email")??"").trim();
 if(!z.email().safeParse(email).success)return {error:"Introduce un email válido."};
 const supabase=await createSupabaseServerClient();
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:env.NEXT_PUBLIC_APP_URL+"/auth/callback?next=/reset-password"});
 if(error)return {error:"No pudimos enviar el enlace. Inténtalo de nuevo más tarde."};
 return {success:"Si hay una cuenta con ese email, recibirás un enlace para recuperar el acceso."};
}
export async function resetPassword(data:FormData){
 if(isDemoMode)return {error:"La demo no tiene contraseñas."};
 const password=String(data.get("password")??"");
 if(password.length<10||password.length>128)return {error:"Usa entre 10 y 128 caracteres."};
 if(password!==data.get("confirmation"))return {error:"Las contraseñas no coinciden."};
 const supabase=await createSupabaseServerClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"El enlace ha caducado. Solicita otro desde la pantalla de acceso."};
 const {error}=await supabase.auth.updateUser({password});
 if(error)return {error:"No pudimos actualizar la contraseña. Solicita otro enlace."};
 redirect("/dashboard");
}
