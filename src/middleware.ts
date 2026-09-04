import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { updateDemoSession } from "@/lib/demo/middleware";
import { IS_DEMO_MODE } from "@/lib/demo/config";

export async function middleware(request: NextRequest) {
  if (IS_DEMO_MODE) {
    return updateDemoSession(request);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
