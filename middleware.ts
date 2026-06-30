import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/uploads/admin/")) {
    const subpath = pathname.slice("/uploads/admin/".length);
    if (!subpath || subpath.includes("..")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.rewrite(new URL(`/api/admin-uploads/${subpath}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/uploads/admin/:path*"
};
