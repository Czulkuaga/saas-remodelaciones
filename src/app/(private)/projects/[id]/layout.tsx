import Link from "next/link";
import { getProjectAction } from "@/action/projects/projects";
import { ProjectTabsClient } from "@/components";

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const project = await getProjectAction(id);

    return (
        <section className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/projects"
                                className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-fuchsia-500"
                            >
                                ← Proyectos
                            </Link>

                            <span className="text-[11px] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-300 border border-fuchsia-500/20">
                                {project.status}
                            </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                            {project.name}
                        </h1>
                        <p className="text-xs font-mono text-fuchsia-500 mt-1">{project.code}</p>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={`/projects/${project.id}/tasks`}
                            className="rounded-lg px-4 py-2 text-sm font-bold border border-fuchsia-500/30 text-slate-700 dark:text-slate-200 hover:bg-fuchsia-500/5"
                        >
                            Ver tareas
                        </Link>
                    </div>
                </div>

                {/* Tabs (client para resaltar activo) */}
                <ProjectTabsClient projectId={project.id} />

                {/* Body */}
                <div className="mt-6">{children}</div>
            </div>
        </section>
    );
}