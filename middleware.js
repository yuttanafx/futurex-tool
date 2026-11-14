import { NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/token";

// ด่านแรก: เช็กว่ามีคุกกี้ที่ลายเซ็นถูกต้อง และหน้า /admin ต้องเป็นแอดมิน
// การเช็กละเอียด (ถูกระงับหรือไม่) ทำอีกชั้นใน requireUser/requireAdmin
export async function middleware(req) {
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.redirect(new URL("/login", req.url));
  if (req.nextUrl.pathname.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
