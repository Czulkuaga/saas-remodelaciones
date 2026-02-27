"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

function pad(n: number, width: number) {
    const s = String(n);
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

/**
 * SAP-like:
 * - Tenant.code = BUKRS
 * - Org BP = entidad legal (BusinessPartner ORGANIZATION) asociada al Tenant
 * - Code del BP: NumberRange (BUSINESS_PARTNER)
 */
export async function ensureTenantOrgBPAction(): Promise<
    | { ok: true; created: boolean; bpId: string; bpCode: string }
    | { ok: false; message: string }
> {
    const tenantId = await requireTenantId();

    try {
        const res = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    id: true,
                    code: true, // BUKRS
                    name: true,
                    orgBusinessPartnerId: true,
                    orgBusinessPartner: { select: { id: true, type: true, code: true } },
                },
            });
            if (!tenant) throw new Error("Tenant not found");

            // ✅ Ya existe y es ORGANIZATION
            if (
                tenant.orgBusinessPartnerId &&
                tenant.orgBusinessPartner?.type === "ORGANIZATION"
            ) {
                return {
                    ok: true as const,
                    created: false as const,
                    bpId: tenant.orgBusinessPartnerId,
                    bpCode: tenant.orgBusinessPartner.code,
                };
            }

            // 1) Reservar consecutivo (NumberRangeObject.BUSINESS_PARTNER)
            const nr = await tx.numberRange.upsert({
                where: {
                    tenantId_object: {
                        tenantId,
                        object: "BUSINESS_PARTNER",
                    },
                },
                create: {
                    tenantId,
                    object: "BUSINESS_PARTNER",
                    prefix: "BP",
                    nextNo: 1,
                    padding: 6,
                },
                update: {},
                select: { id: true, prefix: true, nextNo: true, padding: true },
            });

            const current = nr.nextNo;

            await tx.numberRange.update({
                where: { id: nr.id },
                data: { nextNo: current + 1 },
            });

            const prefix = nr.prefix ?? "BP";
            const bpCode = `${prefix}-${pad(current, nr.padding)}`;

            // 2) Crear BP ORGANIZATION
            const bp = await tx.businessPartner.create({
                data: {
                    tenantId,
                    code: bpCode,
                    type: "ORGANIZATION",
                    organizationName: tenant.name,
                    isActive: true,
                },
                select: { id: true, code: true },
            });

            // 3) Vincular al Tenant (relación TenantOrgBP)
            await tx.tenant.update({
                where: { id: tenantId },
                data: { orgBusinessPartnerId: bp.id },
            });

            return {
                ok: true as const,
                created: true as const,
                bpId: bp.id,
                bpCode: bp.code,
            };
        });

        revalidatePath("/settings");
        return res;
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}