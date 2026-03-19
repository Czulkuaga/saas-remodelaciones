"use client";

function money(n: number, currencyCode: string | null) {
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode ?? "—"}`;
}

function diffTone(value: number) {
    return value === 0
        ? "text-emerald-600 dark:text-emerald-200"
        : "text-rose-600 dark:text-rose-200";
}

export function ProjectExpenseValidationSummary({
    totals,
    currencyCode,
}: {
    totals: {
        expenseTotal: number;
        itemsTotal: number;
        allocatedTotal: number;
        expenseVsItemsDiff: number;
        itemsVsAllocationsDiff: number;
    };
    currencyCode: string | null;
}) {
    const cards = [
        { label: "Documento", value: totals.expenseTotal },
        { label: "Ítems", value: totals.itemsTotal },
        { label: "Asignado", value: totals.allocatedTotal },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 p-4"
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {money(card.value, currencyCode)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Diferencia documento vs ítems
                    </p>
                    <p className={["mt-2 text-lg font-bold", diffTone(totals.expenseVsItemsDiff)].join(" ")}>
                        {money(totals.expenseVsItemsDiff, currencyCode)}
                    </p>
                </div>

                <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Diferencia ítems vs asignaciones
                    </p>
                    <p className={["mt-2 text-lg font-bold", diffTone(totals.itemsVsAllocationsDiff)].join(" ")}>
                        {money(totals.itemsVsAllocationsDiff, currencyCode)}
                    </p>
                </div>
            </div>
        </div>
    );
}