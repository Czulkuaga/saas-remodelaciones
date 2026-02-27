"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function addPartnerIdentifierAction(
    formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const partnerId = String(formData.get("partnerId") ?? "");
    const type = String(formData.get("type") ?? "");
    const value = String(formData.get("value") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;
    const isPrimary = formData.get("isPrimary") === "on";

    if (!partnerId || !type || !value) return { ok: false, message: "Campos requeridos incompletos." };

    try {
        const partner = await prisma.businessPartner.findFirst({
            where: { id: partnerId, tenantId },
            select: { id: true },
        });
        if (!partner) return { ok: false, message: "Empresa (BP) no encontrada para este tenant." };

        await prisma.$transaction(async (tx) => {
            if (isPrimary) {
                await tx.partnerIdentifier.updateMany({
                    where: { tenantId, partnerId, isPrimary: true },
                    data: { isPrimary: false },
                });
            }

            await tx.partnerIdentifier.create({
                data: {
                    tenantId,
                    partnerId,
                    type: type as any,
                    value,
                    countryCode,
                    isPrimary,
                    isVerified: false,
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

export async function setPartnerIdentifierPrimaryAction(
    identifierId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    try {
        const identifier = await prisma.partnerIdentifier.findFirst({
            where: { id: identifierId, tenantId },
            select: { id: true, partnerId: true },
        });
        if (!identifier) return { ok: false, message: "Identificador no encontrado." };

        await prisma.$transaction(async (tx) => {
            await tx.partnerIdentifier.updateMany({
                where: { tenantId, partnerId: identifier.partnerId },
                data: { isPrimary: false },
            });

            await tx.partnerIdentifier.update({
                where: { id: identifier.id },
                data: { isPrimary: true },
            });
        });

        revalidatePath("/settings");
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}

export async function deletePartnerIdentifierAction(
    identifierId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    try {
        const identifier = await prisma.partnerIdentifier.findFirst({
            where: { id: identifierId, tenantId },
            select: { id: true },
        });
        if (!identifier) return { ok: false, message: "Identificador no encontrado." };

        await prisma.partnerIdentifier.delete({ where: { id: identifier.id } });

        revalidatePath("/settings");
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}