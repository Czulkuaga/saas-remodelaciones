"use client";

import { ProjectExpenseStatus } from "../../../../../generated/prisma/enums";
import { ProjectExpenseFiltersState } from "./project-expenses.types";

function isValidStatus(v: string): v is ProjectExpenseStatus {
    return ["DRAFT", "REVIEW_PENDING", "POSTED", "CANCELLED"].includes(v);
}

export function ProjectExpensesFilters({
    filters,
    onChange,
    onSubmit,
    onReset,
    pending,
}: {
    filters: ProjectExpenseFiltersState;
    onChange: (next: ProjectExpenseFiltersState) => void;
    onSubmit: () => void;
    onReset: () => void;
    pending?: boolean;
}) {
    return (
        <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <input
                    placeholder="Buscar documento, proveedor o descripción..."
                    value={filters.q}
                    onChange={(e) => onChange({ ...filters, q: e.target.value })}
                    className="md:col-span-2 bg-white dark:bg-slate-950/30 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                />

                <select
                    value={filters.status}
                    onChange={(e) => {
                        const value = e.target.value;
                        onChange({
                            ...filters,
                            status: value === "" ? "" : isValidStatus(value) ? value : "",
                        });
                    }}
                    className="bg-white dark:bg-slate-950/30 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                >
                    <option value="">Estado</option>
                    <option value="DRAFT">Borrador</option>
                    <option value="REVIEW_PENDING">Por revisar</option>
                    <option value="POSTED">Confirmado</option>
                    <option value="CANCELLED">Cancelado</option>
                </select>

                <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                    className="bg-white dark:bg-slate-950/30 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                />

                <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                    className="bg-white dark:bg-slate-950/30 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                />

                <div className="flex items-center gap-2 flex-col lg:flex-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={pending}
                        className="flex-1 rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                    >
                        {pending ? "Filtrando..." : "Filtrar"}
                    </button>

                    <button
                        type="button"
                        onClick={onReset}
                        disabled={pending}
                        className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60 cursor-pointer"
                    >
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    );
}