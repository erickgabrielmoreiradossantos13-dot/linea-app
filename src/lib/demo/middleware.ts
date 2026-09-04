import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "linea_demo_session";

export function updateDemoSession(request: NextRequest) {
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === "active";
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname.startsWith("/login");

  if (!hasSession && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
