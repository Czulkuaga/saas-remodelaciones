import { listProjectPartnersAction } from "@/action/projects/project-team";
import { ProjectTeamClient } from "@/components";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { getProjectAction } from "@/action/projects/projects";

export default async function ProjectTeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await getProjectAction(id);

    const team = await listProjectPartnersAction(id);

    const tenantId = await requireTenantId();
    const partners = await prisma.businessPartner.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ organizationName: "asc" }, { firstName: "asc" }],
        select: {
            id: true,
            code: true,
            type: true,
            organizationName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,

            // ✅ traer roles maestro del BP
            roles: {
                select: { role: true },
                orderBy: { role: "asc" },
            },
        },
    });

    return <ProjectTeamClient projectId={id} initialTeam={team} partners={partners} />;
}