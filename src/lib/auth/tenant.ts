// src/lib/auth/tenant.ts
import type { NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "static"
]);

function isIpAddress(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/:\d+$/, "");
}

function extractSubdomainFromHost(host: string): string | null {
  const cleanHost = normalizeHost(host);

  if (!cleanHost) return null;
  if (isIpAddress(cleanHost)) return null;

  const parts = cleanHost.split(".").filter(Boolean);

  // localhost cases:
  // demo.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    const sub = parts[0];
    if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
    return null;
  }

  // production-like cases:
  // slug.domain.com
  // slug.preview.domain.com
  if (parts.length >= 3) {
    const sub = parts[0];
    if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
  }

  return null;
}

/**
 * Resolves tenant slug from request.
 * Priority:
 * 1) Subdomain
 * 2) x-tenant header (dev / internal proxies)
 */
export function resolveTenantSlugFromRequest(
  req: NextRequest
): string | null {
  const host = req.headers.get("host") ?? "";

  // 1️⃣ Subdomain
  const sub = extractSubdomainFromHost(host);
  if (sub) return sub;

  // 2️⃣ Header fallback (ONLY for dev/internal use)
  const headerTenant = req.headers.get("x-tenant");
  if (headerTenant && !RESERVED_SUBDOMAINS.has(headerTenant)) {
    return headerTenant.toLowerCase();
  }

  return null;
}