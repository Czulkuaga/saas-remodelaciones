import { getProjectBudgetSummaryAction } from "@/action/projects/project-budget";
import { getProjectAction } from "@/action/projects/projects";

function money(n: number, currency?: string | null) {
    const code = currency ?? "—";
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${code}`;
}

export default async function ProjectBudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await getProjectAction(id);
    const s = await getProjectBudgetSummaryAction(id);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                    { k: "Base", v: money(s.baseTotal, s.currency) },
                    { k: "Cambios", v: money(s.changesTotal, s.currency) },
                    { k: "Presupuesto", v: money(s.revisedBudget, s.currency) },
                    { k: "Ejecutado", v: money(s.expensesTotal, s.currency) },
                ].map((x) => (
                    <div key={x.k} className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{x.k}</p>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{x.v}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Detalle</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        MVP: usa la moneda del quote más reciente (si existe).
                    </p>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Quotes</p>
                        <div className="mt-3 space-y-2">
                            {s.quotes.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400">Sin quotes.</p>
                            ) : (
                                s.quotes.map((q) => (
                                    <div key={q.id} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-300">{q.code} • {q.status}</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{money(Number(q.total), q.currencyCode)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Change Orders</p>
                        <div className="mt-3 space-y-2">
                            {s.changeOrders.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400">Sin change orders aprobados/implementados.</p>
                            ) : (
                                s.changeOrders.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-300">{c.code} • {c.status}</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                                            {money(Number(c.estimatedCost ?? 0), c.currencyCode)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Pagos</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Total pagado: <span className="font-semibold text-slate-800 dark:text-slate-100">{money(s.paymentsTotal, s.currency)}</span>
                        </p>
                    </div>

                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Balances</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Vs gastos: <span className="font-semibold text-slate-800 dark:text-slate-100">{money(s.balanceVsExpenses, s.currency)}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Vs pagos: <span className="font-semibold text-slate-800 dark:text-slate-100">{money(s.balanceVsPayments, s.currency)}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}