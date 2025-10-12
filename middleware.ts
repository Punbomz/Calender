// middleware.ts (in project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  console.log("Middleware check:", {
    path: pathname,
    hasSession: !!session,
  });

  // Protect /profile route - redirect to login if no session
  if (pathname.startsWith("/profile")) {
    if (!session) {
      console.log("No session found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if(pathname === "/profile/edit"){
      return NextResponse.next();
    }
    console.log("Session found, allowing access to profile");
  }

  // Redirect to profile if already logged in and trying to access login
  if (pathname === "/login") {
    if (session) {
      console.log("Already logged in, redirecting to profile");
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  // Redirect to profile if already logged in and trying to access register
  if (pathname === "/register") {
    if (session) {
      console.log("Already logged in, redirecting to profile");
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/login", "/register"],
};
