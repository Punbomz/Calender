import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Redirect ถ้าไม่มี session
  if (pathname.startsWith("/profile") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ถ้ามี session แล้ว ห้ามกลับไปหน้า login/register
  if (["/login", "/register"].includes(pathname) && session) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/login", "/register"],
};
