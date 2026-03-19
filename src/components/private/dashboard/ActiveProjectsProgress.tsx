"use client";

import Link from "next/link";
import type { ActiveProjectProgressRow } from "@/action/dashboard/dashboard-actions";

export function ActiveProjectsProgress({ rows }: { rows: ActiveProjectProgressRow[] }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-100">Proyectos activos</div>
                    <div className="text-xs text-slate-400">Progreso basado en tareas (peso).</div>
                </div>
                <Link href="/projects" className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200">
                    Ver todos →
                </Link>
            </div>

            <div className="space-y-3">
                {rows.map((r) => (
                    <Link
                        key={r.id}
                        href={`/projects/${r.id}`}
                        className="block rounded-xl border border-slate-200/10 bg-slate-900/20 p-3 hover:bg-slate-900/35 transition"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-100 truncate">
                                    {r.code} · {r.name}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                    <span>Progreso: {r.progressPct}%</span>
                                    {r.overdueTasks ? (
                                        <span className="text-rose-300">· {r.overdueTasks} tareas vencidas</span>
                                    ) : null}
                                    {r.stale ? <span className="text-amber-300">· sin actividad reciente</span> : null}
                                </div>
                            </div>

                            <div className="text-xs font-bold text-slate-100">{r.progressPct}%</div>
                        </div>

                        <div className="mt-2 h-2 w-full rounded-full bg-slate-800/60 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${Math.max(0, Math.min(100, r.progressPct))}%` }}
                            />
                        </div>
                    </Link>
                ))}

                {rows.length === 0 ? (
                    <div className="text-sm text-slate-400">No hay proyectos activos.</div>
                ) : null}
            </div>
        </div>
    );
}