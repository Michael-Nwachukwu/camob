import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isSignInPage = pathname === "/admin/sign-in";
  const isAdminPage = pathname.startsWith("/admin");

  // Admin JSON endpoints: respond with 401 instead of redirecting.
  if (isApiAdmin) {
    if (!request.auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAdminPage) {
    return NextResponse.next();
  }

  if (!request.auth && !isSignInPage) {
    const signInUrl = new URL("/admin/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (request.auth && isSignInPage) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Include the bare paths explicitly — `/admin/:path*` alone can miss the
  // exact `/admin` (and `/api/admin`) entry point depending on the
  // path-matching version, which would leave the dashboard ungated.
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"]
};
