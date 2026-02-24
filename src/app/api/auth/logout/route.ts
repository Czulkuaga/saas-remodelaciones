import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dora_session";
const PEPPER = process.env.AUTH_TOKEN_PEPPER ?? "dev-pepper";

function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

function tokenHashFromRawToken(token: string) {
    return sha256(`${token}.${PEPPER}`);
}

export function getClientIp(req: NextRequest) {
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

export async function POST(req: NextRequest) {
    const ip = normalizeIp(getClientIp(req));
    const userAgent = req.headers.get("user-agent") ?? null;
    const host = req.headers.get("host") ?? null;

    const token = req.cookies.get(COOKIE_NAME)?.value ?? null;

    let tenantId: string | null = null;
    let userId: string | null = null;
    let hadActiveSession = false;

    if (token) {
        const tokenHash = tokenHashFromRawToken(token);

        // 1) Lee la sesión actual para obtener tenant/user
        const s = await prisma.session.findUnique({
            where: { tokenHash },
            select: { tenantId: true, userId: true, revokedAt: true, expiresAt: true },
        });

        tenantId = s?.tenantId ?? null;
        userId = s?.userId ?? null;

        // 2) Revoca e incluye contexto (esto te faltaba)
        const upd = await prisma.session.updateMany({
            where: { tokenHash, revokedAt: null },
            data: {
                revokedAt: new Date(),
                ip,          // ✅ guarda IP al revocar
                userAgent,   // ✅ guarda userAgent al revocar
            },
        });

        hadActiveSession = upd.count > 0;
    }

    // 3) Borra cookie (idempotente)
    const res = NextResponse.json({ ok: true, redirectTo: "/login" });
    res.cookies.delete(COOKIE_NAME);

    // 4) AuthEvent LOGOUT con contexto siempre
    await prisma.authEvent.create({
        data: {
            tenantId,
            userId,
            type: "LOGOUT",
            success: true,
            message: token
                ? hadActiveSession
                    ? "Logout"
                    : "Logout (no active session to revoke)"
                : "Logout without session cookie",
            ip,
            userAgent,
            host,
            metadata: {
                reason: "USER_LOGOUT",
                hadCookie: !!token,
                hadActiveSession,
            },
        },
        select: { id: true },
    });

    return res;
}