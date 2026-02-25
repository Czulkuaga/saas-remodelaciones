import { prisma } from "@/lib/prisma";

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

export type TenantResolveResult =
    | { ok: true; slug: string; name: string } // único
    | { ok: true; options: Array<{ slug: string; name: string; status: string }> } // varios
    | { ok: false; code: string; message: string; status?: number; tenant?: any };

export async function resolveTenant(query: string, slugGuess?: string): Promise<TenantResolveResult> {
    const q = String(query ?? "").trim();
    const sg = normalizeSlug(String(slugGuess ?? ""));

    if (!q) return { ok: false, code: "MISSING_QUERY", message: "Missing query", status: 400 };

    const extracted = tryExtractSlugFromQuery(q);
    const slugToTry = sg || extracted;

    // 1) Try by slug first
    if (slugToTry) {
        const t = await prisma.tenant.findUnique({
            where: { slug: slugToTry },
            select: { slug: true, name: true, status: true, deletedAt: true },
        });

        if (t) {
            if (t.deletedAt || t.status === "DELETED") {
                return { ok: false, code: "TENANT_DELETED", message: "This clinic is deleted.", status: 410, tenant: t };
            }
            if (t.status === "SUSPENDED") {
                return { ok: false, code: "TENANT_SUSPENDED", message: "This clinic is suspended.", status: 423, tenant: t };
            }
            if (t.status === "ACTIVE") {
                return { ok: true, slug: t.slug, name: t.name };
            }
        }
    }

    // 2) Search by name
    const candidates = await prisma.tenant.findMany({
        where: {
            deletedAt: null,
            name: { contains: q, mode: "insensitive" },
            status: { in: ["ACTIVE", "SUSPENDED", "DELETED"] },
        },
        select: { slug: true, name: true, status: true },
        take: 8,
        orderBy: { name: "asc" },
    });

    if (candidates.length === 0) {
        return { ok: false, code: "NOT_FOUND", message: "Clinic not found.", status: 404 };
    }

    const active = candidates.filter((c) => c.status === "ACTIVE").map(({ slug, name, status }) => ({ slug, name, status }));

    if (active.length === 1) return { ok: true, slug: active[0].slug, name: active[0].name };
    if (active.length > 1) return { ok: true, options: active };

    return { ok: false, code: "NO_ACTIVE", message: "No active clinic matches your search.", status: 409 };
}