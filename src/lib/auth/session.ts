// src/lib/auth/session.ts
import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantSlugFromRequest } from "./tenant";
import {
    AuthEventType,
    MembershipCategory,
    TenantStatus,
    Prisma,
} from "../../../generated/prisma/client";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dora_session";
const PEPPER = process.env.AUTH_TOKEN_PEPPER ?? "dev-pepper";

const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS ?? "1");
const REMEMBER_DAYS = Number(process.env.AUTH_REMEMBER_DAYS ?? "30");

// Security: en prod NO deberías bypass host/tenant.
// Útil para local/dev cuando no tienes subdominios.
const ALLOW_HOST_BYPASS = process.env.AUTH_ALLOW_HOST_BYPASS === "true";

const TEN_MIN = 10 * 60 * 1000; // throttling writes lastSeenAt
const IDLE_LIMIT = 30 * 60 * 1000; // 30 min

function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}
function tokenHash(token: string) {
    return sha256(`${token}.${PEPPER}`);
}
function newToken() {
    return crypto.randomBytes(48).toString("base64url");
}

// host -> tenantSlug (subdomain) parsing
function getSubdomainFromHost(host: string): string | null {
    if (!host) return null;
    // strip port
    const clean = host.toLowerCase().replace(/:\d+$/, "");

    // examples:
    // clinic-01.domain.com -> clinic-01
    // clinic-01.localhost -> clinic-01
    // localhost -> (no subdomain)
    // 127.0.0.1 -> (no subdomain)
    const parts = clean.split(".").filter(Boolean);
    if (parts.length < 2) return null;

    // If ends with localhost, still ok (clinic-01.localhost)
    // Return first label always
    return parts[0] ?? null;
}

export type AuthContext = {
    userId: string;
    tenantId: string;
    membershipId: string;
    category: MembershipCategory;
    permissions: Set<string>;
};

export type AuthFailReason =
    | "missing"
    | "invalid"
    | "revoked"
    | "expired"
    | "idle"
    | "tenant_inactive"
    | "host_mismatch"
    | "user_inactive"
    | "membership_inactive";

type AuthOk = {
    ok: true;
    tokenHash: string;
    session: {
        userId: string;
        tenantId: string;
        expiresAt: Date;
        revokedAt: Date | null;
        lastSeenAt: Date | null;
    };
    tenant: { id: string; slug: string; status: TenantStatus; deletedAt: Date | null };
    user: { id: string; isActive: boolean };
    membership: { id: string; category: MembershipCategory; isActive: boolean };
};

type AuthFail = { ok: false; reason: AuthFailReason };

async function logAuthEvent(params: {
    type: AuthEventType;
    tenantId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    host?: string | null;
    userId?: string | null;
    success: boolean;
    message?: string | null;
    metadata?: any;
}) {
    try {
        await prisma.authEvent.create({
        data: {
            tenantId: params.tenantId ?? null,
            userId: params.userId ?? null,
            type: params.type,
            success: params.success,
            message: params.message ?? null,
            ip: params.ip ?? null,
            userAgent: params.userAgent ?? null,
            host: params.host ?? null,
            metadata: params.metadata ?? undefined,
        },
        select: { id: true },
    });
    } catch {
        // no-op (no rompas auth por logging)
    }
}

async function revokeSessionByHash(hash: string) {
    await prisma.session.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}

async function validateSessionCore(): Promise<AuthOk | AuthFail> {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;

    if (!token) return { ok: false, reason: "missing" };

    const hash = tokenHash(token);

    const session = await prisma.session.findUnique({
        where: { tokenHash: hash },
        select: {
            userId: true,
            tenantId: true,
            expiresAt: true,
            revokedAt: true,
            lastSeenAt: true,
        },
    });

    if (!session) return { ok: false, reason: "invalid" };
    if (session.revokedAt) return { ok: false, reason: "revoked" };

    const now = Date.now();

    // absolute expiry
    if (session.expiresAt.getTime() <= now) {
        await revokeSessionByHash(hash);

        await logAuthEvent({
            tenantId: session.tenantId,
            userId: session.userId,
            type: "SESSION_EXPIRED",
            success: true,
            message: "Session expired",
            metadata: { expiresAt: session.expiresAt },
        });

        return { ok: false, reason: "expired" };
    }

    // idle timeout
    if (session.lastSeenAt && now - session.lastSeenAt.getTime() > IDLE_LIMIT) {
        await revokeSessionByHash(hash);

        await logAuthEvent({
            tenantId: session.tenantId,
            userId: session.userId,
            type: "SESSION_IDLE_TIMEOUT",
            success: true,
            message: "Session revoked due to inactivity",
            metadata: { lastSeenAt: session.lastSeenAt },
        });

        return { ok: false, reason: "idle" };
    }

    // tenant status + deletedAt
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { id: true, slug: true, status: true, deletedAt: true },
    });

    if (!tenant) return { ok: false, reason: "invalid" };

    if (tenant.deletedAt || tenant.status !== "ACTIVE") {
        await logAuthEvent({
            tenantId: tenant.id,
            userId: session.userId,
            type: "LOGIN_FAILED",
            success: false,
            message: "Tenant inactive",
            metadata: { status: tenant.status, deletedAt: tenant.deletedAt },
        });

        return { ok: false, reason: "tenant_inactive" };
    }

    // host <-> tenant slug check (subdominio)
    if (!ALLOW_HOST_BYPASS) {
        const h = await headers();
        const host = h.get("host") ?? "";
        const sub = getSubdomainFromHost(host);

        if (!sub || sub !== tenant.slug) {
            await logAuthEvent({
                tenantId: tenant.id,
                userId: session.userId,
                type: "LOGIN_FAILED",
                success: false,
                message: "Host/tenant mismatch",
                metadata: { host, expectedSlug: tenant.slug, got: sub },
            });

            return { ok: false, reason: "host_mismatch" };
        }
    }

    // user isActive
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
        await logAuthEvent({
            tenantId: tenant.id,
            userId: session.userId,
            type: "LOGIN_FAILED",
            success: false,
            message: "User inactive",
        });

        return { ok: false, reason: "user_inactive" };
    }

    // membership isActive
    const membership = await prisma.tenantMembership.findUnique({
        where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        select: { id: true, category: true, isActive: true },
    });

    if (!membership || !membership.isActive) {
        await logAuthEvent({
            tenantId: tenant.id,
            userId: user.id,
            type: "LOGIN_FAILED",
            success: false,
            message: "Membership inactive",
            metadata: { membershipFound: !!membership, membershipActive: membership?.isActive ?? null },
        });

        return { ok: false, reason: "membership_inactive" };
    }

    // throttle lastSeenAt touch
    if (!session.lastSeenAt || now - session.lastSeenAt.getTime() > TEN_MIN) {
        await prisma.session.update({
            where: { tokenHash: hash },
            data: { lastSeenAt: new Date() },
            select: { id: true },
        });
    }

    return {
        ok: true,
        tokenHash: hash,
        session,
        tenant,
        user,
        membership,
    };
}

/**
 * getAuthStatus()
 * - Para middleware/guards rápidos: devuelve ok + reason
 */
export async function getAuthStatus(): Promise<
    | { ok: true; session: { userId: string; tenantId: string; expiresAt: Date; revokedAt: Date | null; lastSeenAt: Date | null } }
    | { ok: false; reason: AuthFailReason }
> {
    const res = await validateSessionCore();
    if (!res.ok) return res;
    return { ok: true, session: res.session };
}

/**
 * getAuthContext()
 * - Para autorización: devuelve user/tenant/membership + permisos
 * - Si no pasa validación, devuelve null (usa getAuthStatus si necesitas reason)
 */
export async function getAuthContext(_req?: NextRequest): Promise<AuthContext | null> {
    const res = await validateSessionCore();
    if (!res.ok) return null;

    const rolePerms = await prisma.membershipRole.findMany({
        where: { membershipId: res.membership.id },
        select: {
            role: {
                select: {
                    permissions: { select: { permission: { select: { key: true } } } },
                },
            },
        },
    });

    const permissions = new Set<string>();
    for (const mr of rolePerms) {
        for (const rp of mr.role.permissions) permissions.add(rp.permission.key);
    }

    return {
        userId: res.user.id,
        tenantId: res.tenant.id,
        membershipId: res.membership.id,
        category: res.membership.category,
        permissions,
    };
}

/**
 * createSession()
 * - Crea session y setea cookie httpOnly
 */
export async function createSession(params: {
    userId: string;
    tenantId: string;
    remember: boolean;
    ip?: string | null;
    userAgent?: string | null;
    host?: string | null;
}) {
    const token = newToken();
    const hash = tokenHash(token);

    const days = params.remember ? REMEMBER_DAYS : SESSION_DAYS;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.session.create({
        data: {
            userId: params.userId,
            tenantId: params.tenantId,
            tokenHash: hash,
            expiresAt,
            ip: params.ip ?? null,
            userAgent: params.userAgent ?? null,
            lastSeenAt: new Date(),
        },
        select: { id: true },
    });

    const jar = await cookies();
    jar.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    await logAuthEvent({
        tenantId: params.tenantId,
        userId: params.userId,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        host: params.host ?? null,
        type: "LOGIN_SUCCESS",
        success: true,
        message: "Session created",
        metadata: { remember: params.remember, expiresAt },
    });

    return { expiresAt };
}

/**
 * revokeCurrentSession()
 * - Revoca la session y elimina cookie
 */
export async function revokeCurrentSession() {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;

    if (!token) return;

    const hash = tokenHash(token);

    // best-effort: get session for logging
    const s = await prisma.session.findUnique({
        where: { tokenHash: hash },
        select: { userId: true, tenantId: true },
    });

    await revokeSessionByHash(hash);

    await logAuthEvent({
        tenantId: s?.tenantId ?? null,
        userId: s?.userId ?? null,
        type: "LOGOUT",
        success: true,
        message: "Session revoked by user",
    });

    jar.delete(COOKIE_NAME);
}

/**
 * resolveTenantIdFromRequest()
 * - Útil para login (usa el slug del request)
 */
export async function resolveTenantIdFromRequest(req: NextRequest) {
    const slug = resolveTenantSlugFromRequest(req);
    if (!slug) return null;

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: { id: true, slug: true, status: true, deletedAt: true },
    });

    if (!tenant) return null;
    if (tenant.deletedAt) return null;
    if (tenant.status !== "ACTIVE") return null;

    return tenant.id;
}