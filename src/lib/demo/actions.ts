"use server";

import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo/data";
import { clearDemoSession, setDemoSession } from "@/lib/demo/store";

export async function demoSignIn(email: string, password: string): Promise<{ error: string | null }> {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { error: "Email o contraseña incorrectos. Inténtalo de nuevo." };
  }

  await setDemoSession();
  return { error: null };
}

export async function demoSignOut() {
  await clearDemoSession();
}
