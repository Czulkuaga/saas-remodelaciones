import "dotenv/config";
import { prisma } from "@/lib/prisma";

const PERMISSIONS: { key: string; description: string }[] = [
    { key: "third_parties.read", description: "Ver terceros/partners" },
    { key: "third_parties.write", description: "Crear/editar terceros/partners" },

    { key: "users.read", description: "Ver usuarios del tenant" },
    { key: "users.write", description: "Gestionar usuarios del tenant (membresía, teléfono, contraseña)" },

    { key: "roles.read", description: "Ver roles y permisos" },
    { key: "roles.write", description: "Gestionar roles, permisos y asignaciones" },

    { key: "settings.read", description: "Ver configuración del tenant" },
    { key: "settings.write", description: "Editar configuración del tenant" },

    { key: "projects.read", description: "Ver proyectos" },
    { key: "projects.write", description: "Crear/editar proyectos" },
    { key: "projects.archive", description: "Archivar proyectos" },

    { key: "projects.team.read", description: "Ver equipo del proyecto" },
    { key: "projects.team.write", description: "Gestionar equipo del proyecto" },

    { key: "projects.tasks.read", description: "Ver tareas del proyecto" },
    { key: "projects.tasks.write", description: "Gestionar tareas del proyecto" },

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

const SYSTEM_ROLES: { name: string; key: string; permissions: string[] }[] = [
    {
        name: "Viewer",
        key: "viewer",
        permissions: [
            "third_parties.read",
            "projects.read",
            "projects.team.read",
            "projects.tasks.read",
            "projects.budget.read",
            "projects.budget.versions.read",
            "projects.budget.reserved.read",
            "projects.budget.costs.read",
            "projects.budget.profit.read",
            "users.read",
        ],
    },
    {
        name: "Collaborator",
        key: "collaborator",
        permissions: [
            "third_parties.read",
            "projects.read",
            "projects.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "projects.team.read",
            "projects.budget.read",
            "users.read",
        ],
    },
    {
        name: "Project Manager",
        key: "project_manager",
        permissions: [
            "third_parties.read",
            "third_parties.write",
            "projects.read",
            "projects.write",
            "projects.archive",
            "projects.team.read",
            "projects.team.write",
            "projects.tasks.read",
            "projects.tasks.write",
            "projects.budget.read",
            "projects.budget.write",
            "projects.budget.versions.read",
            "users.read",
        ],
    },
    {
        name: "Accountant",
        key: "accountant",
        permissions: [
            "projects.read",
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
        key: "tenant_admin",
        permissions: ["users.read", "users.write", "roles.read", "roles.write", "settings.read", "settings.write"],
    },
];

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[OK]" : "[MISSING]");
    const beforePerms = await prisma.permission.count();
    const beforeRoles = await prisma.role.count();
    console.log("Before => Permission:", beforePerms, "Role:", beforeRoles);

    // 1) Permissions
    for (const p of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key: p.key },
            update: { description: p.description },
            create: { key: p.key, description: p.description },
        });
    }

    // 2) System roles (tenantId null)
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
                    data: { tenantId: null, name: r.name, key: r.key, isSystem: true },
                    select: { id: true },
                })
            ).id;

        const permIds = await prisma.permission.findMany({
            where: { key: { in: r.permissions } },
            select: { id: true },
        });

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId } });
            await tx.rolePermission.createMany({
                data: permIds.map((p) => ({ roleId, permissionId: p.id })),
                skipDuplicates: true,
            });
        });
    }

    const afterPerms = await prisma.permission.count();
    const afterRoles = await prisma.role.count();
    const afterRP = await prisma.rolePermission.count();
    console.log("After  => Permission:", afterPerms, "Role:", afterRoles, "RolePermission:", afterRP);
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