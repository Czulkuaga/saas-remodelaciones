"use client";

export function ProjectExpensesToolbar({
    onCreate,
    onUpload,
}: {
    onCreate?: () => void;
    onUpload?: () => void;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Gastos del proyecto
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Registra compras reales, revisa documentos y distribuye su impacto sobre el presupuesto.
                </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onUpload}
                    className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                >
                    Cargar factura
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 cursor-pointer"
                >
                    Nuevo gasto
                </button>
            </div>
        </div>
    );
}