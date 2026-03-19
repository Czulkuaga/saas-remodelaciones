"use client";

import { ProjectExpenseListRow } from "./project-expenses.types";

function money(n: number, currencyCode: string | null) {
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode ?? "—"}`;
}

export function ProjectExpensesStats({
    rows,
    currencyCode,
}: {
    rows: ProjectExpenseListRow[];
    currencyCode: string | null;
}) {
    const totalExpenses = rows.length;
    const totalExecuted = rows.reduce((acc, row) => acc + row.totalAmount, 0);
    const totalPending = rows.reduce((acc, row) => acc + row.pendingAmount, 0);

    const cards = [
        {
            label: "Documentos",
            value: String(totalExpenses),
            note: "Gastos registrados",
        },
        {
            label: "Ejecutado",
            value: money(totalExecuted, currencyCode),
            note: "Total del período filtrado",
        },
        {
            label: "Pendiente",
            value: money(totalPending, currencyCode),
            note: "Por asignar a presupuesto",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl border border-fuchsia-500/15 bg-white/60 dark:bg-slate-950/10 p-4"
                >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {card.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {card.note}
                    </p>
                </div>
            ))}
        </div>
    );
}