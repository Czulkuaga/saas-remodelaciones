"use client";

import { ProjectExpenseStatusBadge } from "../ProjectExpenseStatusBadge";

function formatDate(value: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString("es-CO");
    } catch {
        return "—";
    }
}

function money(n: number | null, currencyCode: string | null) {
    if (n == null) return "—";
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode ?? "—"}`;
}

export function ProjectExpenseHeader({
    expense,
}: {
    expense: {
        id: string;
        status: any;
        partnerName: string | null;
        docType: string | null;
        docNo: string | null;
        docDate: string | null;
        occurredAt: string | null;
        notes: string | null;
        currencyCode: string;
        subtotalAmount: number | null;
        taxAmount: number | null;
        totalAmount: number;
    };
}) {
    return (
        <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5 flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {expense.docNo ?? "Sin documento"}
                        </h2>
                        <ProjectExpenseStatusBadge status={expense.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {expense.partnerName ?? "Sin proveedor"}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total documento</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {money(expense.totalAmount, expense.currencyCode)}
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Tipo:</span> {expense.docType ?? "—"}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Fecha documento:</span> {formatDate(expense.docDate)}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Fecha gasto:</span> {formatDate(expense.occurredAt)}</p>
                </div>

                <div className="space-y-2">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Subtotal:</span> {money(expense.subtotalAmount, expense.currencyCode)}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Impuestos:</span> {money(expense.taxAmount, expense.currencyCode)}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Moneda:</span> {expense.currencyCode}</p>
                </div>

                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Notas</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                        {expense.notes ?? "—"}
                    </p>
                </div>
            </div>
        </div>
    );
}