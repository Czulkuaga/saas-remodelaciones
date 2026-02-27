"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function setPartnerIdentifierPrimaryAction(
    identifierId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    try {
        const identifier = await prisma.partnerIdentifier.findFirst({
            where: { id: identifierId, tenantId },
            select: { id: true, partnerId: true },
        });

        if (!identifier) {
            return { ok: false, message: "Identifier not found" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.partnerIdentifier.updateMany({
                where: {
                    tenantId,
                    partnerId: identifier.partnerId,
                },
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