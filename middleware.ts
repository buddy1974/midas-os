import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

export default auth(function middleware(
  req: NextRequest & { auth: Session | null }
) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isPublic =
    pathname === "/login" || pathname.startsWith("/api/auth");

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
