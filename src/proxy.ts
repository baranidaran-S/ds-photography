import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/* Guards /admin and the admin APIs. Only the signed cookie is checked here — the
   database is deliberately not touched, because proxy can run ahead of the app
   (see node_modules/next/dist/docs/.../proxy.md). Route handlers re-check the
   session before they write anything. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isLoginPage = pathname === "/admin/login";
  const isAuthApi = pathname.startsWith("/api/admin/auth");

  // signed in already — keep them out of the login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (session || isLoginPage || isAuthApi) return NextResponse.next();

  // APIs answer with JSON; pages bounce to the login screen
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
