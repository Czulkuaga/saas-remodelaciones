"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateOrgBillingLocationAction(
    formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const locationId = String(formData.get("locationId") ?? "");
    if (!locationId) return { ok: false, message: "Missing locationId" };

    const name = String(formData.get("locationName") ?? "").trim() || "Dirección Fiscal";

    const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
    const addressLine2 = String(formData.get("addressLine2") ?? "").trim() || null;

    const district = String(formData.get("district") ?? "").trim() || null;
    const state = String(formData.get("state") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const postalCode = String(formData.get("postalCode") ?? "").trim() || null;

    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;

    const contactName = String(formData.get("contactName") ?? "").trim() || null;
    const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
    const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;

    try {
        // seguridad: la location debe pertenecer al tenant
        const exists = await prisma.location.findFirst({
            where: { id: locationId, tenantId },
            select: { id: true },
        });
        if (!exists) return { ok: false, message: "Location not found for tenant" };

        await prisma.location.update({
            where: { id: locationId },
            data: {
                name,
                addressLine1,
                addressLine2,
                district,
                state,
                city,
                postalCode,
                countryCode,
                contactName,
                contactPhone,
                contactEmail,
            },
        });

        revalidatePath("/settings");
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { ok: false, message };
    }
}