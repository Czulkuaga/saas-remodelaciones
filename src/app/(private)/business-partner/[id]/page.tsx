import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessPartnerByIdAction } from "@/action/business-partner/business-partner";

type SP = Record<string, string>;

function displayName(p: any) {
    const person = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    return (p.organizationName?.trim() || person || p.code).trim();
}

export default async function BusinessPartnerDetailPage({ params }: { params: Promise<SP> | SP; }) {
    const p = (await params) ?? {};
    const bp = await getBusinessPartnerByIdAction(p.id);
    if (!bp) return notFound();

    return (
        <section className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark/50">
            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center mb-2">
                            <Link
                                href="/business-partner"
                                className="text-xs font-bold text-slate-400 hover:text-fuchsia-300 transition"
                            >
                                ← Volver al listado
                            </Link>
                        </div>
                        <p className="text-xs font-bold text-fuchsia-500/80 uppercase tracking-wider">BP {bp.code}</p>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {displayName(bp)}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Tipo: {bp.type} · Estado: {bp.isActive ? "Activo" : "Inactivo"}
                        </p>
                    </div>

                    <Link
                        href={`/business-partner/${bp.id}/edit`}
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600"
                    >
                        Editar
                    </Link>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/40 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                            <div>Email: <span className="text-slate-500 dark:text-slate-300">{bp.email ?? "—"}</span></div>
                            <div>Tel: <span className="text-slate-500 dark:text-slate-300">{bp.phone ?? "—"}</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/40 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyectos</p>
                        <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
                            {bp._count.remodelingProjects}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Proyectos vinculados</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/40 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyectos</p>
                        <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
                            {bp._count.remodelingProjectPartners}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Proyectos vinculados</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/40 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tareas</p>
                        <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
                            {bp._count.remodelingTasks}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tareas asignadas</p>
                    </div>

                    {/* Roles */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/40 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roles</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {(bp.roles?.length ?? 0) === 0 ? (
                                <span className="text-xs text-slate-500 dark:text-slate-400">Sin roles.</span>
                            ) : (
                                bp.roles.map((r: string) => (
                                    <span
                                        key={r}
                                        className="text-[11px] px-2 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-200"
                                    >
                                        {r}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Placeholder */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/20 dark:border-slate-700 shadow-sm p-6">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Siguiente</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Aquí vamos a agregar Identificadores y Direcciones (SAP-like) en las siguientes iteraciones.
                    </p>
                </div>
            </div>
        </section>
    );
}