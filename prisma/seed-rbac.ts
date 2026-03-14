import "dotenv/config";
import { prisma } from "@/lib/prisma";

type PermissionSeed = {
    key: string;
    description: string;
};

type RoleSeed = {
    name: string;
    key: string;
    permissions: string[];
};

const PERMISSIONS: PermissionSeed[] = [
    // -------------------------
    // Tenant / settings
    // -------------------------
    { key: "tenant.read", description: "Ver información general del tenant" },
    { key: "tenant.write", description: "Editar información general del tenant" },

    { key: "settings.read", description: "Ver configuración del tenant" },
    { key: "settings.write", description: "Editar configuración del tenant" },

    // -------------------------
    // Billing / subscription
    // -------------------------
    { key: "billing.read", description: "Ver suscripción, facturación y plan" },
    { key: "billing.write", description: "Gestionar suscripción, plan y facturación" },

    // -------------------------
    // Third parties / partners
    // -------------------------
    { key: "third_parties.read", description: "Ver terceros/partners" },
    { key: "third_parties.write", description: "Crear/editar terceros/partners" },

    // -------------------------
    // Users / roles
    // -------------------------
    { key: "users.read", description: "Ver usuarios del tenant" },
    { key: "users.write", description: "Gestionar usuarios del tenant" },

    { key: "roles.read", description: "Ver roles y permisos" },
    { key: "roles.write", description: "Gestionar roles, permisos y asignaciones" },

    // -------------------------
    // Projects
    // -------------------------
    { key: "projects.read", description: "Ver proyectos" },
    { key: "projects.write", description: "Crear/editar proyectos" },
    { key: "projects.archive", description: "Archivar proyectos" },

    // -------------------------
    // Team
    // -------------------------
    { key: "projects.team.read", description: "Ver equipo del proyecto" },
    { key: "projects.team.write", description: "Gestionar equipo del proyecto" },

    // -------------------------
    // Tasks
    // -------------------------
    { key: "projects.tasks.read", description: "Ver tareas del proyecto" },
    { key: "projects.tasks.write", description: "Gestionar tareas del proyecto" },

    // -------------------------
    // Budgets - compatibilidad general
    // -------------------------
    { key: "budgets.read", description: "Ver presupuestos del tenant" },
    { key: "budgets.write", description: "Gestionar presupuestos del tenant" },

    // -------------------------
    // Budgets - permisos reales del módulo
    // -------------------------
    { key: "projects.budget.read", description: "Ver presupuesto del proyecto" },
    { key: "projects.budget.write", description: "Gestionar presupuesto del proyecto" },

    { key: "projects.budget.versions.read", description: "Ver versiones de presupuesto" },
    { key: "projects.budget.versions.approve", description: "Aprobar versiones de presupuesto" },

    { key: "projects.budget.reserved.read", description: "Ver reservado" },
    { key: "projects.budget.reserved.write", description: "Gestionar reservado" },

    { key: "projects.budget.costs.read", description: "Ver costos/gastos" },
    { key: "projects.budget.costs.write", description: "Gestionar costos/gastos" },

    { key: "projects.budget.profit.read", description: "Ver ganancias/utilidades" },
];

const SYSTEM_ROLES: RoleSeed[] = [
    // -------------------------
    // Roles legacy / operativos
    // -------------------------
    {
        name: "Colaborador",
        key: "COLLABORATOR",
        permissions: [
            "tenant.read",
            "settings.read",
            "third_parties.read",
            "projects.read",
            "projects.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "projects.team.read",
            "budgets.read",
            "projects.budget.read",
            "users.read",
        ],
    },
    {
        name: "Project Manager",
        key: "PROJECT_MANAGER",
        permissions: [
            "tenant.read",
            "settings.read",
            "third_parties.read",
            "third_parties.write",
            "projects.read",
            "projects.write",
            "projects.archive",
            "projects.team.read",
            "projects.team.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "budgets.read",
            "budgets.write",
            "projects.budget.read",
            "projects.budget.write",
            "projects.budget.versions.read",
            "users.read",
        ],
    },
    {
        name: "Accountant",
        key: "ACCOUNTANT",
        permissions: [
            "tenant.read",
            "settings.read",
            "billing.read",
            "projects.read",
            "budgets.read",
            "budgets.write",
            "projects.budget.read",
            "projects.budget.write",
            "projects.budget.versions.read",
            "projects.budget.reserved.read",
            "projects.budget.reserved.write",
            "projects.budget.costs.read",
            "projects.budget.costs.write",
            "projects.budget.profit.read",
            "users.read",
        ],
    },
    {
        name: "Tenant Admin",
        key: "TENANT_ADMIN",
        permissions: [
            "tenant.read",
            "tenant.write",
            "settings.read",
            "settings.write",
            "users.read",
            "users.write",
            "roles.read",
            "roles.write",
            "billing.read",
            "billing.write",
        ],
    },

    // -------------------------
    // Roles system pensados para onboarding/presets
    // -------------------------
    {
        name: "Administrator",
        key: "ADMIN",
        permissions: [
            "tenant.read",
            "tenant.write",
            "settings.read",
            "settings.write",
            "billing.read",
            "billing.write",
            "third_parties.read",
            "third_parties.write",
            "users.read",
            "users.write",
            "roles.read",
            "roles.write",
            "projects.read",
            "projects.write",
            "projects.archive",
            "projects.team.read",
            "projects.team.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "budgets.read",
            "budgets.write",
            "projects.budget.read",
            "projects.budget.write",
            "projects.budget.versions.read",
            "projects.budget.versions.approve",
            "projects.budget.reserved.read",
            "projects.budget.reserved.write",
            "projects.budget.costs.read",
            "projects.budget.costs.write",
            "projects.budget.profit.read",
        ],
    },
    {
        name: "Manager",
        key: "MANAGER",
        permissions: [
            "tenant.read",
            "settings.read",
            "third_parties.read",
            "third_parties.write",
            "projects.read",
            "projects.write",
            "projects.team.read",
            "projects.team.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "budgets.read",
            "budgets.write",
            "projects.budget.read",
            "projects.budget.write",
            "projects.budget.versions.read",
            "users.read",
        ],
    },
    {
        name: "Viewer",
        key: "VIEWER",
        permissions: [
            "tenant.read",
            "settings.read",
            "billing.read",
            "third_parties.read",
            "projects.read",
            "projects.team.read",
            "projects.tasks.read",
            "budgets.read",
            "projects.budget.read",
            "projects.budget.versions.read",
            "projects.budget.reserved.read",
            "projects.budget.costs.read",
            "projects.budget.profit.read",
            "users.read",
        ],
    },
];

async function upsertPermissions() {
    for (const p of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key: p.key },
            update: { description: p.description },
            create: { key: p.key, description: p.description },
        });
    }
}

async function upsertSystemRoles() {
    for (const r of SYSTEM_ROLES) {
        const existing = await prisma.role.findFirst({
            where: { tenantId: null, key: r.key },
            select: { id: true },
        });

        const roleId = existing
            ? (
                await prisma.role.update({
                    where: { id: existing.id },
                    data: { name: r.name, isSystem: true },
                    select: { id: true },
                })
            ).id
            : (
                await prisma.role.create({
                    data: {
                        tenantId: null,
                        name: r.name,
                        key: r.key,
                        isSystem: true,
                    },
                    select: { id: true },
                })
            ).id;

        const permRecords = await prisma.permission.findMany({
            where: { key: { in: r.permissions } },
            select: { id: true, key: true },
        });

        const foundKeys = new Set(permRecords.map((p) => p.key));
        const missing = r.permissions.filter((key) => !foundKeys.has(key));

        if (missing.length > 0) {
            throw new Error(
                `SYSTEM_ROLE_${r.key}_HAS_MISSING_PERMISSIONS: ${missing.join(", ")}`
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({
                where: { roleId },
            });

            await tx.rolePermission.createMany({
                data: permRecords.map((p) => ({
                    roleId,
                    permissionId: p.id,
                })),
                skipDuplicates: true,
            });
        });
    }
}

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[OK]" : "[MISSING]");

    const beforePerms = await prisma.permission.count();
    const beforeRoles = await prisma.role.count();

    console.log("Before => Permission:", beforePerms, "Role:", beforeRoles);

    await upsertPermissions();
    await upsertSystemRoles();

    const afterPerms = await prisma.permission.count();
    const afterRoles = await prisma.role.count();
    const afterRP = await prisma.rolePermission.count();

    console.log(
        "After  => Permission:",
        afterPerms,
        "Role:",
        afterRoles,
        "RolePermission:",
        afterRP
    );
}

main()
    .then(() => console.log("✅ RBAC seed completed"))
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });