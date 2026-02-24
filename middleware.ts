// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dora_session";

// Rutas protegidas
const PROTECTED_PREFIXES = ["/dashboard", "/app", "/settings", "/profile", "/api/"];

// Rutas públicas / estáticas
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/health",
  "/tenant",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/:\d+$/, "");
}

function isIpAddress(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function extractTenantFromHost(hostHeader: string): string | null {
  const host = normalizeHost(hostHeader);
  if (!host) return null;
  if (host === "localhost" || isIpAddress(host)) return null;

  const parts = host.split(".").filter(Boolean);

  // demo.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    const sub = parts[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
    return null;
  }

  // slug.domain.com / slug.preview.domain.com
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
  }

  return null;
}

function extractTenantFromPath(pathname: string): string | null {
  // soporta /t/:slug/...
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "t") return null;
  const slug = parts[1];
  if (!slug) return null;
  if (RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug.toLowerCase();
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return NextResponse.next();

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};