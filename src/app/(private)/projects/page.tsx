import Link from "next/link";
import { listProjectsAction, ProjectsListMode } from "@/action/projects/projects";

function partnerLabel(p: any) {
    if (!p) return "—";
    return p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(" ") ?? "—";
}

function tabClass(active: boolean) {
    return [
        "px-3 py-1.5 rounded-md text-xs font-bold border transition",
        active
            ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-400 dark:text-fuchsia-200"
            : "border-fuchsia-500/10 bg-slate-950/10 text-slate-600 dark:text-slate-300 hover:bg-slate-950/20",
    ].join(" ");
}

function statusPill(status: string) {
    return "text-[11px] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-300 border border-fuchsia-500/20";
}

export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>;
}) {
    const sp = await searchParams;

    const mode = (sp.mode as ProjectsListMode) ?? "active";
    const safeMode: ProjectsListMode = ["active", "archived", "deleted", "all"].includes(mode) ? mode : "active";

    const projects = await listProjectsAction(safeMode);

    const titleByMode: Record<ProjectsListMode, string> = {
        active: "Proyectos activos",
        archived: "Proyectos archivados",
        deleted: "Proyectos eliminados",
        all: "Todos los proyectos",
    };

    return (
        <section className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Remodelaciones • Tareas • Presupuesto • Equipo
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href="/projects?mode=active" className={tabClass(safeMode === "active")}>
                                Activos
                            </Link>
                            <Link href="/projects?mode=archived" className={tabClass(safeMode === "archived")}>
                                Archivados
                            </Link>
                            <Link href="/projects?mode=deleted" className={tabClass(safeMode === "deleted")}>
                                Eliminados
                            </Link>
                            <Link href="/projects?mode=all" className={tabClass(safeMode === "all")}>
                                Todos
                            </Link>
                        </div>

                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {titleByMode[safeMode]} • {projects.length}
                        </p>
                    </div>

                    <Link
                        href="/projects/new"
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600"
                    >
                        Nuevo Proyecto
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-sm text-slate-500 dark:text-slate-400">
                        No hay proyectos en esta vista.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {projects.map((p) => {
                            const isArchived = !!p.archivedAt;
                            const isDeleted = !!p.deletedAt;

                            const card = (
                                <div
                                    className={[
                                        "bg-white dark:bg-slate-800 rounded-xl border-2 shadow-sm p-5 transition",
                                        isDeleted
                                            ? "border-rose-500/30 opacity-70"
                                            : "border-fuchsia-500/60 dark:border-slate-700 hover:border-fuchsia-500",
                                    ].join(" ")}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-mono text-fuchsia-500">{p.code}</p>

                                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>

                                                {isArchived ? (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-200">
                                                        ARCHIVED
                                                    </span>
                                                ) : null}

                                                {isDeleted ? (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-200">
                                                        DELETED
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Cliente: {partnerLabel((p as any).clientPartner)} • Tareas: {p._count.tasks} • Equipo:{" "}
                                                {p._count.projectPartners}
                                            </p>

                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                {p.city ?? "—"} {p.countryCode ? `(${p.countryCode})` : ""}
                                            </p>

                                            {isDeleted ? (
                                                <p className="mt-2 text-[11px] text-rose-500/90 dark:text-rose-200">
                                                    Este proyecto está eliminado (soft delete). Solo debería usarse para auditoría.
                                                </p>
                                            ) : isArchived ? (
                                                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                    Archivado: fuera de operación diaria. (Recomendación SAP-like: solo lectura.)
                                                </p>
                                            ) : null}
                                        </div>

                                        <span className={statusPill(String(p.status))}>{p.status}</span>
                                    </div>
                                </div>
                            );

                            // UX: si está deleted, lo dejo SIN Link (solo tarjeta). Si prefieres, lo puedes linkear igual.
                            return isDeleted ? (
                                <div key={p.id}>{card}</div>
                            ) : (
                                <Link key={p.id} href={`/projects/${p.id}`} className="block">
                                    {card}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}