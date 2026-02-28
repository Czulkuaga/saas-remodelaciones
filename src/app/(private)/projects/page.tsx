import Link from "next/link";
import { listProjectsAction } from "@/action/projects/projects";

function partnerLabel(p: any) {
    if (!p) return "—";
    return p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(" ") ?? "—";
}

export default async function ProjectsPage() {
    const projects = await listProjectsAction();

    return (
        <section className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Remodelaciones • Tareas • Presupuesto • Equipo
                        </p>
                    </div>

                    <Link
                        href="/projects/new"
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600"
                    >
                        Nuevo Proyecto
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {projects.map((p) => (
                        <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5 hover:border-fuchsia-500 transition"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-mono text-fuchsia-500">{p.code}</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{p.name}</p>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Cliente: {partnerLabel(p.clientPartner)} • Tareas: {p._count.tasks} • Equipo: {p._count.projectPartners}
                                    </p>

                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                        {p.city ?? "—"} {p.countryCode ? `(${p.countryCode})` : ""}
                                    </p>
                                </div>

                                <span className="text-[11px] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-300 border border-fuchsia-500/20">
                                    {p.status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}