import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Lightweight session-cookie presence check; full auth happens server-side in pages.
  const hasSession =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/samples/:path*", "/patients/:path*", "/tests/:path*", "/results/:path*", "/reports/:path*", "/inventory/:path*", "/audit-log/:path*", "/admin/:path*", "/portal/:path*", "/doctor/:path*", "/orders/:path*", "/qc/:path*", "/analytics/:path*"],
};
