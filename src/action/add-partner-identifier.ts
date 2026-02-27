"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { PartnerIdentifierType } from "../../generated/prisma/client";

export async function addPartnerIdentifierAction(
    formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const partnerId = String(formData.get("partnerId") ?? "");
    const type = String(formData.get("type") ?? "");
    const value = String(formData.get("value") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;
    const isPrimary = formData.get("isPrimary") === "on";

    if (!partnerId || !type || !value) {
        return { ok: false, message: "Missing required fields" };
    }

    try {
        // Seguridad: partner debe pertenecer al tenant
        const partner = await prisma.businessPartner.findFirst({
            where: { id: partnerId, tenantId },
            select: { id: true },
        });

        if (!partner) {
            return { ok: false, message: "Partner not found for tenant" };
        }

        await prisma.$transaction(async (tx) => {
            // Si va a ser primary → quitar primary anteriores
            if (isPrimary) {
                await tx.partnerIdentifier.updateMany({
                    where: {
                        tenantId,
                        partnerId,
                        isPrimary: true,
                    },
                    data: { isPrimary: false },
                });
            }

            // Crear el nuevo identificador
            await tx.partnerIdentifier.create({
                data: {
                    tenantId,
                    partnerId,
                    type: type as PartnerIdentifierType,
                    value,
                    countryCode: countryCode || null,
                    isPrimary,
                },
            });

        });

        revalidatePath("/settings");
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}