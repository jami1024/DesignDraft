import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/share/", "/api/share/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const authToken = process.env.DESIGNDRAFT_AUTH_TOKEN;

  if (!authToken) {
    return NextResponse.next();
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/_next/") || request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("dd_session")?.value;

  if (sessionCookie === authToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
