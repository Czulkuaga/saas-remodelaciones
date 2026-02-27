"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

function pad(n: number, width: number) {
    const s = String(n);
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

export async function ensureOrgBillingLocationAction(): Promise<
    | { ok: true; created: boolean; locationId: string; locationCode: string }
    | { ok: false; message: string }
> {
    const tenantId = await requireTenantId();

    try {
        const out = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    id: true,
                    name: true,
                    countryCode: true,
                    orgBusinessPartnerId: true,
                    orgBusinessPartner: {
                        select: {
                            id: true,
                            type: true,
                            businessPartnerLocations: {
                                where: { usage: "BILLING", isPrimary: true },
                                take: 1,
                                select: { id: true, locationId: true },
                            },
                        },
                    },
                },
            });

            if (!tenant) throw new Error("Tenant not found");

            const org =
                tenant.orgBusinessPartnerId &&
                    tenant.orgBusinessPartner?.type === "ORGANIZATION"
                    ? tenant.orgBusinessPartner
                    : null;

            if (!org) {
                return { ok: false as const, message: "Org BP not found. Create org BP first." };
            }

            const existing = org.businessPartnerLocations?.[0];
            if (existing?.locationId) {
                const loc = await tx.location.findFirst({
                    where: { id: existing.locationId, tenantId },
                    select: { id: true, code: true },
                });
                if (!loc) throw new Error("Billing location link exists but location not found");

                return {
                    ok: true as const,
                    created: false as const,
                    locationId: loc.id,
                    locationCode: loc.code,
                };
            }

            // 1) Consecutivo para LOCATION
            const nr = await tx.numberRange.upsert({
                where: { tenantId_object: { tenantId, object: "LOCATION" } },
                create: { tenantId, object: "LOCATION", prefix: "LOC", nextNo: 1, padding: 4 },
                update: {},
                select: { id: true, prefix: true, nextNo: true, padding: true },
            });

            const current = nr.nextNo;
            await tx.numberRange.update({
                where: { id: nr.id },
                data: { nextNo: current + 1 },
            });

            const prefix = nr.prefix ?? "LOC";
            const locationCode = `${prefix}-${pad(current, nr.padding)}`;

            // 2) Crear Location
            const location = await tx.location.create({
                data: {
                    tenantId,
                    code: locationCode,
                    name: "Dirección Fiscal",
                    countryCode: tenant.countryCode ?? null,
                },
                select: { id: true, code: true },
            });

            // 3) Link BusinessPartnerLocation (BILLING + primary)
            await tx.businessPartnerLocation.create({
                data: {
                    tenantId,
                    partnerId: org.id,
                    locationId: location.id,
                    usage: "BILLING",
                    isPrimary: true,
                },
                select: { id: true },
            });

            return {
                ok: true as const,
                created: true as const,
                locationId: location.id,
                locationCode: location.code,
            };
        });

        if (!out.ok) return out;

        revalidatePath("/settings");
        return out;
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}