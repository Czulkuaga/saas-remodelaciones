import { listProjectTasksAction } from "@/action/projects/project-tasks";
import { getProjectAction } from "@/action/projects/projects";
import { ProjectTasksBoardClient } from "@/components";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await getProjectAction(id); // valida acceso + existe
    const tasks = await listProjectTasksAction(id);

    const tenantId = await requireTenantId();
    const partners = await prisma.businessPartner.findMany({
        where: { tenantId },
        orderBy: [{ organizationName: "asc" }, { firstName: "asc" }],
        select: { id: true, code: true, type: true, organizationName: true, firstName: true, lastName: true },
    });

    return <ProjectTasksBoardClient projectId={id} initialTasks={tasks} partners={partners} />;
}