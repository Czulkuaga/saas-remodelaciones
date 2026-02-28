import { listProjectTasksAction } from "@/action/projects/project-tasks";
import { getProjectAction } from "@/action/projects/projects";
import { ProjectTasksBoardClient } from "@/components";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { PartnerType } from "../../../../../../generated/prisma/enums";

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await getProjectAction(id); // valida acceso + existe
    const tasks = await listProjectTasksAction(id);

    const tenantId = await requireTenantId();
    const partnersRaw = await prisma.businessPartner.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ organizationName: "asc" }, { firstName: "asc" }],
        select: {
            id: true,
            code: true,
            type: true,
            organizationName: true,
            firstName: true,
            lastName: true,
            roles: { select: { role: true } }, // Prisma: { role: BPRoleType }[]
        },
    });
    const partners = partnersRaw.map((p) => ({
        id: p.id,
        code: p.code,
        type: p.type as PartnerType, // o simplemente p.type si ya coincide
        organizationName: p.organizationName,
        firstName: p.firstName,
        lastName: p.lastName,
        roles: p.roles.map((r) => r.role), // ✅ aplanado a BPRoleType[]
    }));

    return <ProjectTasksBoardClient projectId={id} initialTasks={tasks} partners={partners} />;
}