"use client";

export function ProjectExpensesEmptyState({
    onCreate,
}: {
    onCreate?: () => void;
}) {
    return (
        <div className="rounded-xl border border-dashed border-fuchsia-500/20 bg-slate-50 dark:bg-slate-900/20 p-8 text-center">
            <div className="mx-auto max-w-xl">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No hay gastos registrados
                </h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Registra compras reales del proyecto y luego distribúyelas contra las líneas
                    presupuestales para controlar la ejecución.
                </p>

                <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 cursor-pointer"
                    >
                        Nuevo gasto
                    </button>

                    <button
                        type="button"
                        className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                    >
                        Cargar factura
                    </button>
                </div>
            </div>
        </div>
    );
}