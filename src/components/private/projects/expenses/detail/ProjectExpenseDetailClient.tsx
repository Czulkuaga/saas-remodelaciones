"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postProjectExpenseAction } from "@/action/projects/post-project-expense.action";
import { deleteProjectExpenseAction } from "@/action/projects/delete-project-expense.action";
import { ProjectExpenseHeader } from "./ProjectExpenseHeader";
import { ProjectExpenseValidationSummary } from "./ProjectExpenseValidationSummary";
import { ProjectExpenseItemsSection } from "./ProjectExpenseItemsSection";
import { ProjectExpenseItemCreateForm } from "./ProjectExpenseItemCreateForm";

export function ProjectExpenseDetailClient({
    projectId,
    expenseId,
    data,
}: {
    projectId: string;
    expenseId: string;
    data: any;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function reload() {
        router.refresh();
    }

    const confirmationState = useMemo(() => {
        if (data.expense.status === "POSTED") {
            return {
                canPost: false,
                reason: "Este gasto ya fue confirmado.",
            };
        }

        if (data.expense.status === "CANCELLED") {
            return {
                canPost: false,
                reason: "No puedes confirmar un gasto cancelado.",
            };
        }

        if (!data.items || data.items.length === 0) {
            return {
                canPost: false,
                reason: "Debes agregar al menos un ítem antes de confirmar el gasto.",
            };
        }

        if (Number(data.totals.expenseVsItemsDiff.toFixed(2)) !== 0) {
            return {
                canPost: false,
                reason: "La suma de los ítems debe ser igual al total del documento.",
            };
        }

        if (Number(data.totals.itemsVsAllocationsDiff.toFixed(2)) !== 0) {
            return {
                canPost: false,
                reason: "Todos los ítems deben quedar completamente asignados al presupuesto.",
            };
        }

        return {
            canPost: true,
            reason: null,
        };
    }, [data]);

    function postExpense() {
        startTransition(async () => {
            const res = await postProjectExpenseAction(projectId, expenseId);
            if (!res.ok) {
                alert(res.message);
                return;
            }
            router.refresh();
        });
    }

    function deleteExpense() {
        if (!confirm("¿Eliminar este gasto completo? Se eliminarán también sus ítems y asignaciones.")) {
            return;
        }

        startTransition(async () => {
            const res = await deleteProjectExpenseAction(projectId, expenseId);
            if (!res.ok) {
                alert(res.message);
                return;
            }

            router.push(`/projects/${projectId}`);
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Gasto del proyecto
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {data.expense.docNo ?? "Sin documento"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/projects/${projectId}`)}
                        className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                    >
                        Volver
                    </button>

                    {data.expense.status !== "POSTED" && data.expense.status !== "CANCELLED" ? (
                        <button
                            type="button"
                            onClick={deleteExpense}
                            disabled={pending}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-200 hover:bg-rose-500/15 disabled:opacity-60 cursor-pointer"
                        >
                            Eliminar gasto
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={postExpense}
                        disabled={pending || !confirmationState.canPost}
                        className={[
                            "rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition",
                            confirmationState.canPost
                                ? "bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 cursor-pointer"
                                : "bg-slate-400/70 shadow-none cursor-not-allowed",
                        ].join(" ")}
                        title={confirmationState.reason ?? "Confirmar gasto"}
                    >
                        {pending
                            ? "Procesando..."
                            : data.expense.status === "POSTED"
                                ? "Confirmado"
                                : "Confirmar gasto"}
                    </button>
                </div>
            </div>

            {!confirmationState.canPost && confirmationState.reason ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                    {confirmationState.reason}
                </div>
            ) : null}

            <ProjectExpenseHeader expense={data.expense} />

            <ProjectExpenseValidationSummary
                totals={data.totals}
                currencyCode={data.expense.currencyCode}
            />

            <ProjectExpenseItemCreateForm
                projectId={projectId}
                expenseId={expenseId}
                currencyCode={data.expense.currencyCode}
                onCreated={reload}
            />

            <div>
                <div className="mb-3">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Ítems y asignaciones
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Asigna cada ítem del gasto a una o varias líneas del presupuesto activo.
                    </p>
                </div>

                {data.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-fuchsia-500/20 bg-slate-50 dark:bg-slate-900/20 p-6 text-sm text-slate-500 dark:text-slate-400">
                        Este gasto aún no tiene ítems. El siguiente paso será agregar ítems manuales o generarlos desde OCR.
                    </div>
                ) : (
                    <ProjectExpenseItemsSection
                        projectId={projectId}
                        expenseId={expenseId}
                        currencyCode={data.expense.currencyCode}
                        items={data.items}
                        budgetLines={data.budgetLines}
                        onReload={reload}
                    />
                )}
            </div>
        </div>
    );
}