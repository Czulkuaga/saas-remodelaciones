import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeSlug(s: string) {
    return s.trim().toLowerCase();
}

function tryExtractSlugFromQuery(query: string) {
    const q = query.trim().toLowerCase();
    const noProto = q.replace(/^https?:\/\//, "");
    const host = noProto.split("/")[0] ?? "";
    const first = host.split(".")[0] ?? "";
    const slug = first.trim();
    return slug || null;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const query = String(body?.query ?? "").trim();
    const slugGuess = normalizeSlug(String(body?.slugGuess ?? ""));

    if (!query) {
        return NextResponse.json({ ok: false, code: "MISSING_QUERY", message: "Missing query" }, { status: 400 });
    }

    const extracted = tryExtractSlugFromQuery(query);
    const slugToTry = slugGuess || extracted;

    // 1) Try by slug first (return status!)
    if (slugToTry) {
        const t = await prisma.tenant.findUnique({
            where: { slug: slugToTry },
            select: { slug: true, name: true, status: true, deletedAt: true },
        });

        if (t) {
            if (t.deletedAt || t.status === "DELETED") {
                return NextResponse.json({ ok: false, code: "TENANT_DELETED", message: "This clinic is deleted.", tenant: { slug: t.slug, name: t.name, status: t.status } }, { status: 410 });
            }
            if (t.status === "SUSPENDED") {
                return NextResponse.json({ ok: false, code: "TENANT_SUSPENDED", message: "This clinic is suspended.", tenant: { slug: t.slug, name: t.name, status: t.status } }, { status: 423 });
            }
            if (t.status === "ACTIVE") {
                return NextResponse.json({ ok: true, slug: t.slug, name: t.name });
            }
        }
    }

    // 2) Search by name (include non-active so we can show message)
    const candidates = await prisma.tenant.findMany({
        where: {
            deletedAt: null,
            name: { contains: query, mode: "insensitive" },
            status: { in: ["ACTIVE", "SUSPENDED", "DELETED"] }, // si quieres listar DELETED también
        },
        select: { slug: true, name: true, status: true }, // 👈 importante
        take: 8,
        orderBy: { name: "asc" },
    });

    if (candidates.length === 0) {
        return NextResponse.json(
            { ok: false, code: "NOT_FOUND", message: "Clinic not found. Please check the name or workspace URL." },
            { status: 404 }
        );
    }

    // If multiple, only show ACTIVE in picker (optional)
    const active = candidates.filter((c) => c.status === "ACTIVE").map(({ slug, name }) => ({ slug, name }));

    if (active.length === 1) return NextResponse.json({ ok: true, slug: active[0].slug, name: active[0].name });
    if (active.length > 1) return NextResponse.json({ ok: true, options: candidates });

    // No ACTIVE among matches
    return NextResponse.json(
        { ok: false, code: "NO_ACTIVE", message: "No active clinic matches your search." },
        { status: 409 }
    );
}