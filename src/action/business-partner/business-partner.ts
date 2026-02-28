"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import type { BusinessPartnerKpisDTO, BusinessPartnerListResponse } from "@/types/business-partner/types";
// import type { PartnerType } from "../../../generated/prisma/client";
import { NumberRangeObject, PartnerType, BPRoleType } from "../../../generated/prisma/enums";
import { nextNumberRangeCode } from "@/lib/number-range";

type Query = {
    q?: string;
    type?: PartnerType | "ALL";
    status?: "ACTIVE" | "INACTIVE" | "ALL";
    page?: number;
    pageSize?: number;
};

type CreateBPInput = {
    type: PartnerType;
    roles: BPRoleType[];
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
};

type UpdateBPInput = {
    id: string;
    type: PartnerType;
    roles: BPRoleType[];
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
};

function normalizePage(n: unknown, fallback: number) {
    const x = typeof n === "string" ? Number(n) : (n as number);
    return Number.isFinite(x) && x > 0 ? Math.floor(x) : fallback;
}

function normalizePhone(phone?: string) {
    if (!phone) return null;
    const cleaned = phone.trim();
    if (!cleaned) return null;
    // súper básico por ahora (luego E.164)
    return cleaned.replace(/\s+/g, " ");
}

export async function createBusinessPartnerAction(
    input: CreateBPInput
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const type = input.type;
    const isActive = input.isActive ?? true;

    // ✅ aquí estaba el faltante
    const roles: BPRoleType[] = Array.isArray(input.roles)
        ? input.roles
            .map((r) => String(r).trim())
            .filter(Boolean) as any[] // si quieres, tipéalo a BPRoleType[]
        : [];

    if (roles.length === 0) {
        return { ok: false, message: "Selecciona al menos un rol para el tercero." };
    }

    const organizationName = input.organizationName?.trim() || null;
    const firstName = input.firstName?.trim() || null;
    const lastName = input.lastName?.trim() || null;

    if (type === "ORGANIZATION" && !organizationName) {
        return { ok: false, message: "La organización requiere Razón social." };
    }
    if (type === "PERSON" && !firstName && !lastName) {
        return { ok: false, message: "La persona requiere al menos nombre o apellido." };
    }

    const email = input.email?.trim() || null;
    const phone = normalizePhone(input.phone);
    const phoneNormalized = phone ? phone.replace(/\D/g, "") : null;

    const code = await nextNumberRangeCode({
        tenantId,
        object: NumberRangeObject.BUSINESS_PARTNER,
        defaultPrefix: "BP-",
        defaultPadding: 8,
        defaultNextNo: 1,
    });

    const result = await prisma.$transaction(async (tx) => {
        const bp = await tx.businessPartner.create({
            data: {
                tenantId,
                code,
                type,
                organizationName,
                firstName,
                lastName,
                email,
                phone,
                phoneNormalized,
                isActive,
            },
            select: { id: true },
        });

        await tx.businessPartnerRole.createMany({
            data: roles.map((role) => ({
                tenantId,
                partnerId: bp.id,
                role, // enum BPRoleType
            })),
            skipDuplicates: true,
        });

        return bp;
    });

    return { ok: true, id: result.id };
}

export async function getBusinessPartnerByIdAction(id: string) {
    const tenantId = await requireTenantId();

    const bp = await prisma.businessPartner.findFirst({
        where: { tenantId, id },
        select: {
            id: true,
            code: true,
            type: true,
            organizationName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,

            // ✅ TRAER ROLES
            roles: {
                select: { role: true },
                orderBy: { role: "asc" },
            },

            _count: {
                select: {
                    remodelingProjects: true,
                    remodelingTasks: true,
                    remodelingProjectPartners: true,
                },
            },
        },
    });

    if (!bp) return null;

    // ✅ opcional: devolver roles como array plano
    return {
        ...bp,
        roles: bp.roles.map((r) => r.role),
    };
}

export async function updateBusinessPartnerAction(input: UpdateBPInput): Promise<
    | { ok: true }
    | { ok: false; message: string }
> {
    const tenantId = await requireTenantId();

    const type = input.type;
    const organizationName = input.organizationName?.trim() || null;
    const firstName = input.firstName?.trim() || null;
    const lastName = input.lastName?.trim() || null;

    if (type === "ORGANIZATION" && !organizationName) {
        return { ok: false, message: "La organización requiere Razón social." };
    }
    if (type === "PERSON" && !firstName && !lastName) {
        return { ok: false, message: "La persona requiere al menos nombre o apellido." };
    }

    const roles = Array.isArray(input.roles) ? input.roles : [];
    if (roles.length === 0) {
        return { ok: false, message: "Selecciona al menos un rol para el tercero." };
    }

    const email = input.email?.trim() || null;
    const phone = normalizePhone(input.phone);
    const phoneNormalized = phone ? phone.replace(/\D/g, "") : null;

    await prisma.$transaction(async (tx) => {
        await tx.businessPartner.updateMany({
            where: { tenantId, id: input.id },
            data: {
                type,
                organizationName,
                firstName,
                lastName,
                email,
                phone,
                phoneNormalized,
                isActive: input.isActive ?? true,
            },
        });

        // elimina roles que ya no estén
        await tx.businessPartnerRole.deleteMany({
            where: {
                tenantId,
                partnerId: input.id,
                role: { notIn: roles },
            },
        });

        // crea los que falten
        await tx.businessPartnerRole.createMany({
            data: roles.map((role) => ({ tenantId, partnerId: input.id, role })),
            skipDuplicates: true,
        });
    });

    return { ok: true };
}

export async function getBusinessPartnerKpisAction(): Promise<BusinessPartnerKpisDTO> {
    const tenantId = await requireTenantId();

    const [total, active, organizations, persons] = await Promise.all([
        prisma.businessPartner.count({ where: { tenantId } }),
        prisma.businessPartner.count({ where: { tenantId, isActive: true } }),
        prisma.businessPartner.count({ where: { tenantId, type: "ORGANIZATION" } }),
        prisma.businessPartner.count({ where: { tenantId, type: "PERSON" } }),
    ]);

    return { total, active, organizations, persons };
}

export async function getBusinessPartnerListAction(input: Query): Promise<BusinessPartnerListResponse> {
    const tenantId = await requireTenantId();

    const page = normalizePage(input.page, 1);
    const pageSize = normalizePage(input.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const q = (input.q ?? "").trim();
    const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5); // para combos nombre/apellido

    const type = input.type ?? "ALL";
    const status = input.status ?? "ALL";

    // OR normal (sirve para orgs, email, phone, etc.)
    const fullStringOR = q
        ? {
            OR: [
                { code: { contains: q, mode: "insensitive" as const } },
                { organizationName: { contains: q, mode: "insensitive" as const } },
                { firstName: { contains: q, mode: "insensitive" as const } },
                { lastName: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
                { phone: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : null;

    // ✅ OR adicional para PERSON cuando escriben "Nombre Apellido"
    // (porque "firstName contains 'Nombre Apellido'" no matchea)
    const personNameComboOR =
        tokens.length >= 2
            ? {
                OR: [
                    // first last
                    {
                        AND: [
                            { firstName: { contains: tokens[0], mode: "insensitive" as const } },
                            { lastName: { contains: tokens[1], mode: "insensitive" as const } },
                        ],
                    },
                    // last first (por si escriben al revés)
                    {
                        AND: [
                            { firstName: { contains: tokens[1], mode: "insensitive" as const } },
                            { lastName: { contains: tokens[0], mode: "insensitive" as const } },
                        ],
                    },
                    // opcional: si hay 3+ palabras, exige que cada palabra esté en first o last
                    ...(tokens.length > 2
                        ? [
                            {
                                AND: tokens.map((t) => ({
                                    OR: [
                                        { firstName: { contains: t, mode: "insensitive" as const } },
                                        { lastName: { contains: t, mode: "insensitive" as const } },
                                    ],
                                })),
                            },
                        ]
                        : []),
                ],
            }
            : null;

    const where: any = {
        tenantId,
        ...(type !== "ALL" ? { type } : {}),
        ...(status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {}),
        ...(q
            ? {
                OR: [
                    ...(fullStringOR ? [fullStringOR] : []),
                    ...(personNameComboOR ? [personNameComboOR] : []),
                ],
            }
            : {}),
    };

    const [total, rows] = await Promise.all([
        prisma.businessPartner.count({ where }),
        prisma.businessPartner.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            skip,
            take: pageSize,
            select: {
                id: true,
                code: true,
                type: true,
                firstName: true,
                lastName: true,
                organizationName: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,

                _count: {
                    select: {
                        remodelingProjects: true,
                        remodelingProjectPartners: true, // ✅ team count
                    },
                },
            },
        }),
    ]);
    const items = rows.map((p) => {
        const displayName =
            p.organizationName ??
            ([p.firstName, p.lastName].filter(Boolean).join(" ") || p.code);

        const projectsAsOwner = p._count.remodelingProjects;
        const projectsAsTeam = p._count.remodelingProjectPartners;

        return {
            id: p.id,
            code: p.code,
            displayName,
            type: p.type,
            email: p.email ?? null,
            phone: p.phone ?? null,
            isActive: p.isActive,
            projectsAsOwner,
            projectsAsTeam,
            projectsCount: projectsAsOwner + projectsAsTeam, // ✅ total visible
            createdAt: p.createdAt,
        };
    });

    return { items, total, page, pageSize };
}

export async function toggleBusinessPartnerActiveAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const tenantId = await requireTenantId();

    const bp = await prisma.businessPartner.findFirst({
        where: { tenantId, id },
        select: { id: true, isActive: true },
    });

    if (!bp) return { ok: false, message: "Tercero no encontrado." };

    await prisma.businessPartner.update({
        where: { id: bp.id },
        data: { isActive: !bp.isActive },
    });

    return { ok: true };
}