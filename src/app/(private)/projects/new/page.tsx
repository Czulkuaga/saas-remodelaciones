import { ProjectCreateFormClient } from "@/components";
import { getTenantSettingsAction } from "@/action/tenant-settings";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";

export default async function ProjectNewPage() {
    const settings = await getTenantSettingsAction();
    const tenantId = await requireTenantId();

    // Partners para elegir cliente (simple: todos los BP ORGANIZATION/CLIENT; ajusta como quieras)
    const partners = await prisma.businessPartner.findMany({
        where: { tenantId },
        orderBy: [{ organizationName: "asc" }, { firstName: "asc" }],
        select: { id: true, code: true, type: true, organizationName: true, firstName: true, lastName: true },
    });

    return (
        <section className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight">Nuevo Proyecto</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Crea un proyecto de remodelación (SAP-like code por NumberRange).
                </p>

                <div className="mt-6">
                    <ProjectCreateFormClient settings={settings} partners={partners} />
                </div>
            </div>
        </section>
    );
}