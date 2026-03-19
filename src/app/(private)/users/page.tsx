// src/app/(private)/users/page.tsx
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { UsersTable } from "@/components/private/users/UsersTable";


export const runtime = "nodejs";

export default async function UsersPage() {
    const tenantId = await requireTenantId();

    const rows = await prisma.tenantMembership.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            category: true,
            isActive: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    emailNormalized: true,
                    phone: true,
                    phoneNormalized: true,
                    isActive: true,
                    createdAt: true,
                },
            },
        },
    });

    return (
        <div className="p-6 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-slate-700 dark:text-slate-100">Usuarios</h1>
                <p className="text-sm text-slate-700 dark:text-slate-400">
                    Administra usuarios que pertenecen a este tenant (membresías).
                </p>
            </div>

            <UsersTable initialRows={rows} />
        </div>
    );
}