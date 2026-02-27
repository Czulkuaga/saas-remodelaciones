"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

function normEmail(s: string | null) {
    const v = (s ?? "").trim().toLowerCase();
    return v.length ? v : null;
}
function normPhone(s: string | null) {
    const v = (s ?? "").trim();
    return v.length ? v : null;
}

export async function updateTenantOrgBPAction(
    formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const organizationName = String(formData.get("organizationName") ?? "").trim();
    const email = normEmail(String(formData.get("email") ?? ""));
    const phone = normPhone(String(formData.get("phone") ?? ""));
    const isActive = formData.get("isActive") === "on";

    if (!organizationName) {
        return { ok: false, message: "La razón social es obligatoria." };
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { orgBusinessPartnerId: true },
        });

        if (!tenant?.orgBusinessPartnerId) {
            return { ok: false, message: "No existe BP de organización para este tenant." };
        }

        // Seguridad: actualiza SOLO el org BP del tenant
        const bp = await prisma.businessPartner.findFirst({
            where: {
                id: tenant.orgBusinessPartnerId,
                tenantId,
                type: "ORGANIZATION",
            },
            select: { id: true },
        });

        if (!bp) {
            return { ok: false, message: "El BP de organización no es válido o no pertenece al tenant." };
        }

        await prisma.businessPartner.update({
            where: { id: bp.id },
            data: {
                organizationName,
                email,
                phone,
                phoneNormalized: phone ? phone.replace(/[^\d+]/g, "") : null, // simple
                isActive,
            },
        });

        revalidatePath("/settings");
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}