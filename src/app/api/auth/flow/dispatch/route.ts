import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* ===================== UTILIDADES ===================== */

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

function normalizeSlug(s: string) {
    return s.trim().toLowerCase();
}

function tryExtractSlugFromQuery(query: string) {
    const q = query.trim().toLowerCase();
    const noProto = q.replace(/^https?:\/\//, "");
    const host = noProto.split("/")[0] ?? "";
    const first = host.split(".")[0] ?? "";
    return first.trim() || null;
}

function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

type ScreenId = "TENANT" | "TENANT_SELECT" | "SIGN_IN";

function flow(screen: ScreenId, data: any = {}) {
    return NextResponse.json({ screen, data });
}

const PEPPER = process.env.AUTH_TOKEN_PEPPER ?? "dev-pepper";
const FLOW_DAYS = Number(process.env.AUTH_FLOW_SESSION_DAYS ?? "30");

/* ===================== HANDLER ===================== */

export async function POST(req: NextRequest) {
    const ip = normalizeIp(getClientIp(req));
    const userAgent = req.headers.get("user-agent") ?? null;
    const host = req.headers.get("host") ?? null;

    const body = await req.json().catch(() => null);

    const payload = body?.payload ?? body?.data ?? body ?? {};
    const step = String(payload?.step ?? "").trim();

    const waId =
        String(body?.waId ?? body?.contact?.waId ?? payload?.waId ?? "").trim() ||
        null;

    /* ================= TENANT_LOOKUP ================= */

    if (step === "TENANT_LOOKUP") {
        const queryRaw = String(payload?.tenant_query ?? "").trim();
        if (!queryRaw)
            return flow("TENANT", {
                error_message: "Escribe el nombre o código de la organización.",
            });

        const extracted = tryExtractSlugFromQuery(queryRaw);
        const slugToTry = normalizeSlug(extracted ?? queryRaw);

        const bySlug = await prisma.tenant.findUnique({
            where: { slug: slugToTry },
            select: { slug: true, name: true, status: true, deletedAt: true },
        });

        if (bySlug) {
            if (bySlug.deletedAt || bySlug.status === "DELETED")
                return flow("TENANT", {
                    error_message: "Esta organización está eliminada.",
                });

            if (bySlug.status === "SUSPENDED")
                return flow("TENANT", {
                    error_message: "Esta organización está suspendida.",
                });

            if (bySlug.status === "ACTIVE")
                return flow("SIGN_IN", {
                    tenant_id: bySlug.slug,
                    error_message: "",
                });
        }

        const candidates = await prisma.tenant.findMany({
            where: {
                deletedAt: null,
                status: "ACTIVE",
                name: { contains: queryRaw, mode: "insensitive" },
            },
            select: { slug: true, name: true },
            take: 8,
            orderBy: { name: "asc" },
        });

        if (candidates.length === 0)
            return flow("TENANT", {
                error_message:
                    "No encontré esa organización. Intenta con otro nombre.",
            });

        if (candidates.length === 1)
            return flow("SIGN_IN", {
                tenant_id: candidates[0].slug,
                error_message: "",
            });

        return flow("TENANT_SELECT", {
            tenant_options: candidates.map((x) => ({
                id: x.slug,
                title: x.name,
            })),
            error_message: "",
        });
    }

    /* ================= TENANT_CHOOSE ================= */

    if (step === "TENANT_CHOOSE") {
        const tenantSlug = String(payload?.tenant_id ?? "").trim();
        if (!tenantSlug)
            return flow("TENANT_SELECT", {
                error_message: "Selecciona una organización.",
            });

        return flow("SIGN_IN", {
            tenant_id: tenantSlug,
            error_message: "",
        });
    }

    /* ================= SIGN_IN ================= */

    if (step === "SIGN_IN") {
        const tenantSlug = String(payload?.tenant_id ?? "").trim();
        const email = String(payload?.email ?? "").trim().toLowerCase();
        const password = String(payload?.password ?? "");

        if (!tenantSlug)
            return flow("TENANT", {
                error_message: "Primero selecciona tu organización.",
            });

        if (!email || !password)
            return flow("SIGN_IN", {
                tenant_id: tenantSlug,
                error_message: "Ingresa email y contraseña.",
            });

        const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
            select: { id: true, slug: true, status: true, deletedAt: true },
        });

        if (!tenant || tenant.deletedAt || tenant.status !== "ACTIVE") {
            return flow("TENANT", {
                error_message: "Organización inválida o inactiva.",
            });
        }

        const user = await prisma.user.findUnique({
            where: { emailNormalized: email },
            select: { id: true, passwordHash: true, isActive: true },
        });

        if (!user || !user.isActive)
            return flow("SIGN_IN", {
                tenant_id: tenantSlug,
                error_message: "Credenciales inválidas.",
            });

        const passOk = await bcrypt.compare(password, user.passwordHash);
        if (!passOk)
            return flow("SIGN_IN", {
                tenant_id: tenantSlug,
                error_message: "Credenciales inválidas.",
            });

        const membership = await prisma.tenantMembership.findUnique({
            where: {
                tenantId_userId: { tenantId: tenant.id, userId: user.id },
            },
            select: { isActive: true },
        });

        if (!membership?.isActive)
            return flow("SIGN_IN", {
                tenant_id: tenantSlug,
                error_message: "No tienes acceso a esta organización.",
            });

        /* ===== Revocar SOLO sesiones WHATSAPP_FLOW ===== */

        await prisma.session.updateMany({
            where: {
                userId: user.id,
                tenantId: tenant.id,
                channel: "WHATSAPP_FLOW",
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { revokedAt: new Date() },
        });

        /* ===== Crear sesión ===== */

        const token = crypto.randomBytes(48).toString("base64url");
        const tokenHash = sha256(`${token}.${PEPPER}`);

        const expiresAt = new Date(
            Date.now() + FLOW_DAYS * 24 * 60 * 60 * 1000
        );

        const createdSession = await prisma.session.create({
            data: {
                userId: user.id,
                tenantId: tenant.id,
                tokenHash,
                expiresAt,
                ip,
                userAgent,
                host,
                lastSeenAt: new Date(),
                channel: "WHATSAPP_FLOW",
                waId: waId ?? null,
            },
            select: { id: true },
        });

        /* ===== Guardar identidad del agente ===== */

        if (waId) {
            await prisma.agentIdentity.upsert({
                where: {
                    tenantId_waId: {
                        tenantId: tenant.id,
                        waId,
                    },
                },
                update: {
                    userId: user.id,
                    sessionId: createdSession.id,
                    lastAuthAt: new Date(),
                },
                create: {
                    tenantId: tenant.id,
                    userId: user.id,
                    waId,
                    sessionId: createdSession.id,
                    lastAuthAt: new Date(),
                },
            });
        }

        /* ===== Log AuthEvent ===== */

        await prisma.authEvent.create({
            data: {
                tenantId: tenant.id,
                userId: user.id,
                type: "LOGIN_SUCCESS",
                success: true,
                message: "Flow login success",
                ip,
                userAgent,
                host,
                metadata: {
                    channel: "WHATSAPP_FLOW",
                    expiresAt,
                    waId,
                    sessionId: createdSession.id,
                },
            },
            select: { id: true },
        });

        return flow("SIGN_IN", {
            tenant_id: tenantSlug,
            error_message: "",
            token,
            expiresAt: expiresAt.toISOString(),
        });
    }

    return flow("TENANT", {
        error_message: "Step inválido. Reinicia el formulario.",
    });
}