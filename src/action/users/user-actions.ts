// src/app/(private)/users/actions.ts
"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireTenantId, requireUserId } from "@/lib/auth/session";
import { MembershipCategory } from "../../../generated/prisma/enums";

export type TenantUserRow = {
    id: string; // membershipId
    category: MembershipCategory;
    isActive: boolean;
    createdAt: Date;
    user: {
        id: string;
        email: string;
        emailNormalized: string;
        name: string | null;
        phone: string | null;
        phoneNormalized: string | null;
        isActive: boolean; // global (display)
        createdAt: Date;
    };
};

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/**
 * Recibe SOLO 10 dígitos (Colombia) y devuelve E.164 WhatsApp.
 * "3001234567" -> "+573001234567"
 */
function normalizePhoneCO10ToE164(raw10: string) {
    const digits = raw10.replace(/\D/g, "");
    if (digits.length !== 10) return null;
    return `+57${digits}`;
}

const Phone10Schema = z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Teléfono inválido: deben ser 10 dígitos (solo números).");

const CreateTenantUserSchema = z.object({
    name: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Email inválido"),
    phone10: Phone10Schema,
    category: z.nativeEnum(MembershipCategory),
});

const UpdateTenantUserSchema = z.object({
    membershipId: z.string().uuid(),
    category: z.nativeEnum(MembershipCategory),
    membershipActive: z.coerce.boolean(),

    // permitido editar en esta pantalla (global user):
    phone10: Phone10Schema,
    password: z.string().min(8, "Password mínimo 8").max(200).optional().or(z.literal("")),
});

export async function createOrAttachTenantUserAction(input: unknown) {
    const tenantId = await requireTenantId();
    await requireUserId();

    const parsed = CreateTenantUserSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { name, email, phone10, category } = parsed.data;

    const emailNorm = normalizeEmail(email);
    const phoneE164 = normalizePhoneCO10ToE164(phone10);
    if (!phoneE164) return { ok: false as const, message: "Teléfono inválido: deben ser 10 dígitos (CO)." };

    // Password inicial (por ahora como el seed)
    const INITIAL_USER_PASSWORD = process.env.INITIAL_USER_PASSWORD ?? process.env.SEED_PASSWORD ?? "12345678";
    const passHash = await bcrypt.hash(INITIAL_USER_PASSWORD, 10);

    // Validar que phoneNormalized no choque con otro usuario (si ya lo usas como unique)
    const phoneOwner = await prisma.user.findFirst({
        where: { phoneNormalized: phoneE164 },
        select: { id: true, email: true },
    });

    // Si el phone ya existe en OTRO user, bloquea (evita duplicados WhatsApp)
    // Si luego quieres permitir compartir teléfono, quitamos el unique.
    if (phoneOwner) {
        // Si quieres un mensaje más neutro:
        return { ok: false as const, message: "Ese teléfono ya está registrado en otro usuario." };
    }

    const row = await prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
            where: { emailNormalized: emailNorm },
            update: {
                email,
                emailNormalized: emailNorm,
                isActive: true,
                ...(name?.trim() ? { name: name.trim() } : {}),
                phone: phone10,
                phoneNormalized: phoneE164,
            },
            create: {
                email,
                emailNormalized: emailNorm,
                name: name?.trim() ? name.trim() : null,
                isActive: true,
                passwordHash: passHash,
                phone: phone10,
                phoneNormalized: phoneE164,
            },
            select: { id: true },
        });

        const membership = await tx.tenantMembership.upsert({
            where: { tenantId_userId: { tenantId, userId: user.id } },
            update: { category, isActive: true },
            create: { tenantId, userId: user.id, category, isActive: true },
            select: {
                id: true,
                category: true,
                isActive: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        emailNormalized: true,
                        name: true,
                        phone: true,
                        phoneNormalized: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
            },
        });

        return membership;
    });

    revalidatePath("/users");
    return { ok: true as const, row };
}

export async function updateTenantUserAndMembershipAction(input: unknown) {
    const tenantId = await requireTenantId();
    await requireUserId();

    const parsed = UpdateTenantUserSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { membershipId, category, membershipActive, phone10, password } = parsed.data;

    const phoneE164 = normalizePhoneCO10ToE164(phone10);
    if (!phoneE164) return { ok: false as const, message: "Teléfono inválido: deben ser 10 dígitos (CO)." };

    // Gate: membership debe pertenecer al tenant
    const membership = await prisma.tenantMembership.findFirst({
        where: { id: membershipId, tenantId },
        select: { id: true, userId: true },
    });
    if (!membership) return { ok: false as const, message: "Membresía no encontrada en este tenant." };

    // Validar phoneNormalized unique (permitimos que sea del mismo user)
    const phoneOwner = await prisma.user.findFirst({
        where: { phoneNormalized: phoneE164, id: { not: membership.userId } },
        select: { id: true },
    });
    if (phoneOwner) return { ok: false as const, message: "Ese teléfono ya está registrado en otro usuario." };

    const row = await prisma.$transaction(async (tx) => {
        // 1) update membership (NO delete permitido)
        await tx.tenantMembership.update({
            where: { id: membershipId },
            data: { category, isActive: membershipActive },
        });

        // 2) update user global permitido (phone + password opcional)
        await tx.user.update({
            where: { id: membership.userId },
            data: {
                phone: phone10,
                phoneNormalized: phoneE164,
                ...(password && password.trim().length >= 8
                    ? { passwordHash: await bcrypt.hash(password, 10) }
                    : {}),
            },
        });

        // 3) devolver row actualizado
        const updated = await tx.tenantMembership.findUnique({
            where: { id: membershipId },
            select: {
                id: true,
                category: true,
                isActive: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        emailNormalized: true,
                        name: true,
                        phone: true,
                        phoneNormalized: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
            },
        });

        return updated!;
    });

    revalidatePath("/users");
    return { ok: true as const, row };
}

export async function removeMembershipAction(membershipId: string) {
    const tenantId = await requireTenantId();
    const actorUserId = await requireUserId();

    const mine = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId: actorUserId },
        select: { id: true },
    });
    if (mine?.id === membershipId) {
        return { ok: false as const, message: "No puedes remover tu propia membresía del tenant." };
    }

    const gate = await prisma.tenantMembership.findFirst({
        where: { id: membershipId, tenantId },
        select: { id: true },
    });
    if (!gate) return { ok: false as const, message: "Membresía no encontrada en este tenant." };

    await prisma.tenantMembership.delete({ where: { id: membershipId } });

    revalidatePath("/users");
    return { ok: true as const };
}

export async function updateMembershipAction(input: {
    membershipId: string;
    category: MembershipCategory;
    isActive: boolean;
}) {
    const tenantId = await requireTenantId();
    await requireUserId();

    const { membershipId, category, isActive } = input;

    // 🔒 Verificar que el membership pertenece al tenant actual
    const membership = await prisma.tenantMembership.findFirst({
        where: {
            id: membershipId,
            tenantId,
        },
        select: { id: true },
    });

    if (!membership) {
        return {
            ok: false as const,
            message: "Membresía no encontrada en este tenant.",
        };
    }

    const row = await prisma.tenantMembership.update({
        where: { id: membershipId },
        data: {
            category,
            isActive,
        },
        select: {
            id: true,
            category: true,
            isActive: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    emailNormalized: true,
                    name: true,
                    phone: true,
                    phoneNormalized: true,
                    isActive: true,
                    createdAt: true,
                },
            },
        },
    });

    revalidatePath("/users");

    return {
        ok: true as const,
        row,
    };
}