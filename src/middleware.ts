import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/server/auth/jwt";
import { SESSION_COOKIE } from "@/server/auth/constants";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApp = pathname.startsWith("/app");
  const isAdmin = pathname.startsWith("/admin");

  if (!isApp && !isAdmin) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJwt(token) : null;

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
