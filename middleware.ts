import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Edge runtime ไม่รองรับ process หรือ firebase-admin
// ดังนั้น middleware นี้จะเช็กเฉพาะ cookie เท่านั้น
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  console.log("🔍 Middleware check:", { path: pathname, hasSession: !!sessionCookie });

  // ✅ ป้องกันเข้าหน้า profile โดยไม่มี session
  if (pathname.startsWith("/profile")) {
    if (!sessionCookie) {
      console.log("❌ No session cookie found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ✅ ถ้าล็อกอินแล้ว ห้ามเข้าหน้า login/register
  if (["/login", "/register"].includes(pathname)) {
    if (sessionCookie) {
      console.log("🔁 Already logged in → redirect to /profile");
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/login", "/register"],
};
