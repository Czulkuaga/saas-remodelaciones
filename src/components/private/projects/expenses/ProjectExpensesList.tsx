"use client";

import { ProjectExpenseListRow } from "./project-expenses.types";
import { ProjectExpenseStatusBadge } from "./ProjectExpenseStatusBadge";
import { ProjectExpensesEmptyState } from "./ProjectExpensesEmptyState";

function money(n: number, currencyCode: string | null) {
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode ?? "—"}`;
}

function formatDate(value: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString("es-CO");
    } catch {
        return "—";
    }
}

export function ProjectExpensesList({
    rows,
    currencyCode,
    onOpen,
    onCreate,
}: {
    rows: ProjectExpenseListRow[];
    currencyCode: string | null;
    onOpen?: (expenseId: string) => void;
    onCreate?: () => void;
}) {
    if (rows.length === 0) {
        return <ProjectExpensesEmptyState onCreate={onCreate} />;
    }

    return (
        <div className="rounded-xl border border-fuchsia-500/10 overflow-hidden bg-white/60 dark:bg-slate-950/10">
            <div className="px-4 py-2 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Documentos de gasto ({rows.length})
                </p>
            </div>

            <div className="divide-y divide-fuchsia-500/10">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="px-4 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {row.docNo ?? "Sin documento"}
                                    </p>
                                    <ProjectExpenseStatusBadge status={row.status} />
                                </div>

                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                    {row.partnerName ?? "Sin proveedor"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    DocType: {row.docType ?? "—"} • Fecha: {formatDate(row.occurredAt ?? row.docDate)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:min-w-140">
                                <div className="rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {money(row.totalAmount, currencyCode)}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Ítems</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {row.itemsCount}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Asignado</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {money(row.allocatedAmount, currencyCode)}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pendiente</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {money(row.pendingAmount, currencyCode)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => onOpen?.(row.id)}
                                className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                            >
                                Abrir detalle
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}