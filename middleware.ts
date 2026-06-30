import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  detectLocaleFromRequest,
  isLocale,
  localeCookieName
} from "@/lib/i18n/config";

function handleAdminUploadRewrite(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/uploads/admin/")) {
    return null;
  }

  const subpath = pathname.slice("/uploads/admin/".length);
  if (!subpath || subpath.includes("..")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.rewrite(new URL(`/api/admin-uploads/${subpath}`, request.url));
}

function shouldSkipLocale(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const uploadRewrite = handleAdminUploadRewrite(request);
  if (uploadRewrite) {
    return uploadRewrite;
  }

  const { pathname, search } = request.nextUrl;

  if (shouldSkipLocale(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const locale = detectLocaleFromRequest(cookieLocale, acceptLanguage);
  const targetPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  return NextResponse.redirect(new URL(`${targetPath}${search}`, request.url));
}

export const config = {
  matcher: [
    "/uploads/admin/:path*",
    "/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\..*).*)"
  ]
};
