import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function getClientIp(req: NextRequest) {
    const cf = req.headers.get("cf-connecting-ip");
    if (cf) return cf.trim();

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) {
        const first = fwd.split(",")[0]?.trim();
        if (first) return first;
    }

    return null;
}

function normalizeIp(ip: string | null) {
    if (!ip) return null;
    if (ip === "::1") return "127.0.0.1";
    if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
    return ip;
}

function sanitizeNext(next: unknown): string {
    if (typeof next !== "string") return "/dashboard";
    const v = next.trim();
    if (!v.startsWith("/")) return "/dashboard";
    if (v.startsWith("//")) return "/dashboard";
    if (v.toLowerCase().includes("http://") || v.toLowerCase().includes("https://")) {
        return "/dashboard";
    }
    return v || "/dashboard";
}

export async function POST(req: NextRequest) {
    const ip = normalizeIp(getClientIp(req));
    const userAgent = req.headers.get("user-agent") ?? null;
    const requestHost = req.headers.get("host") ?? null;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "remodelaciones.app";

    const body = await req.json().catch(() => null);

    const tenantSlug = String(body?.tenantSlug ?? "").trim().toLowerCase();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const remember = Boolean(body?.remember ?? true);
    const safeNext = sanitizeNext(body?.next);

    if (!tenantSlug || !email || !password) {
        return NextResponse.json(
            { ok: false, message: "Missing tenantSlug, email or password" },
            { status: 400 }
        );
    }

    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true, slug: true },
    });

    if (!tenant) {
        await prisma.authEvent.create({
            data: {
                type: "LOGIN_FAILED",
                success: false,
                message: "Invalid tenant slug",
                ip,
                userAgent,
                host: requestHost,
                metadata: { tenantSlug, email },
            },
            select: { id: true },
        });

        return NextResponse.json(
            { ok: false, message: "Invalid tenant" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { emailNormalized: email },
        select: {
            id: true,
            passwordHash: true,
            isActive: true,
        },
    });

    if (!user || !user.isActive) {
        await prisma.authEvent.create({
            data: {
                tenantId: tenant.id,
                type: "LOGIN_FAILED",
                success: false,
                message: "Invalid credentials",
                ip,
                userAgent,
                host: requestHost,
                metadata: { tenantSlug, email },
            },
            select: { id: true },
        });

        return NextResponse.json(
            { ok: false, message: "Invalid credentials" },
            { status: 401 }
        );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
        await prisma.authEvent.create({
            data: {
                tenantId: tenant.id,
                userId: user.id,
                type: "LOGIN_FAILED",
                success: false,
                message: "Invalid credentials",
                ip,
                userAgent,
                host: requestHost,
                metadata: { tenantSlug, email },
            },
            select: { id: true },
        });

        return NextResponse.json(
            { ok: false, message: "Invalid credentials" },
            { status: 401 }
        );
    }

    const membership = await prisma.tenantMembership.findUnique({
        where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        select: { isActive: true },
    });

    if (!membership?.isActive) {
        await prisma.authEvent.create({
            data: {
                tenantId: tenant.id,
                userId: user.id,
                type: "LOGIN_FAILED",
                success: false,
                message: "No access to tenant",
                ip,
                userAgent,
                host: requestHost,
                metadata: { tenantSlug, email },
            },
            select: { id: true },
        });

        return NextResponse.json(
            { ok: false, message: "No access to tenant" },
            { status: 403 }
        );
    }

    await prisma.session.updateMany({
        where: {
            userId: user.id,
            tenantId: tenant.id,
            channel: "WEB",
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
    });

    const tenantHost = `${tenant.slug}.${rootDomain}`;

    await createSession({
        userId: user.id,
        tenantId: tenant.id,
        remember,
        ip,
        userAgent,
        host: tenantHost,
    });

    await prisma.authEvent.create({
        data: {
            tenantId: tenant.id,
            userId: user.id,
            type: "LOGIN_SUCCESS",
            success: true,
            message: "Login success from onboarding",
            ip,
            userAgent,
            host: tenantHost,
            metadata: { tenantSlug, remember, next: safeNext },
        },
        select: { id: true },
    });

    return NextResponse.json({
        ok: true,
        redirectTo: `https://${tenantHost}${safeNext}`,
    });
}