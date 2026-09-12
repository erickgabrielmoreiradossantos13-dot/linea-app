import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("true"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  LINEA_INGESTION_PEPPER: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  LINEA_INGESTION_PEPPER: process.env.LINEA_INGESTION_PEPPER,
});

export const env = {
  ...parsedEnv,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE === "true";
