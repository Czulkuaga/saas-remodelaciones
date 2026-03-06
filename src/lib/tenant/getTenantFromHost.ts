import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getTenantFromHost() {
    const h = await headers();
    const host = h.get("host");

    if (!host) return null;

    const slug = host.split(".")[0];

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            status: true,
        },
    });

    return tenant;
}