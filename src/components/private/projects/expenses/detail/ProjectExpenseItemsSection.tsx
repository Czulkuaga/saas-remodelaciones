"use client";

import { useState, useTransition } from "react";
import { saveProjectExpenseAllocationsAction } from "@/action/projects/save-project-expense-allocations.action";
import { updateProjectExpenseItemAction } from "@/action/projects/update-project-expense-item.action";
import { deleteProjectExpenseItemAction } from "@/action/projects/delete-project-expense-item.action";
import { CostCategory } from "../../../../../../generated/prisma/enums";

function money(n: number, currencyCode: string | null) {
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode ?? "—"}`;
}

type BudgetLineOption = {
    id: string;
    code: string;
    title: string;
    category: string;
};

type ItemRow = {
    id: string;
    lineNo: number;
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    lineAmount: number;
    category: string | null;
    rawExtractedText: string | null;
    allocations: Array<{
        id: string;
        budgetLineId: string;
        budgetLineCode: string;
        budgetLineTitle: string;
        amount: number;
        notes: string | null;
    }>;
    allocatedAmount: number;
    pendingAmount: number;
};

export function ProjectExpenseItemsSection({
    projectId,
    expenseId,
    currencyCode,
    items,
    budgetLines,
    onReload,
}: {
    projectId: string;
    expenseId: string;
    currencyCode: string | null;
    items: ItemRow[];
    budgetLines: BudgetLineOption[];
    onReload?: () => void;
}) {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <ExpenseItemCard
                    key={item.id}
                    projectId={projectId}
                    expenseId={expenseId}
                    currencyCode={currencyCode}
                    item={item}
                    budgetLines={budgetLines}
                    onReload={onReload}
                />
            ))}
        </div>
    );
}

function ExpenseItemCard({
    projectId,
    expenseId,
    currencyCode,
    item,
    budgetLines,
    onReload,
}: {
    projectId: string;
    expenseId: string;
    currencyCode: string | null;
    item: ItemRow;
    budgetLines: BudgetLineOption[];
    onReload?: () => void;
}) {
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);

    const [editDescription, setEditDescription] = useState(item.description);
    const [editQuantity, setEditQuantity] = useState(item.quantity != null ? String(item.quantity) : "");
    const [editUnitPrice, setEditUnitPrice] = useState(item.unitPrice != null ? String(item.unitPrice) : "");
    const [editLineAmount, setEditLineAmount] = useState(String(item.lineAmount));
    const [editCategory, setEditCategory] = useState(item.category ?? "");
    const [editRawExtractedText, setEditRawExtractedText] = useState(item.rawExtractedText ?? "");

    const [rows, setRows] = useState<
        Array<{ budgetLineId: string; amount: string; notes?: string }>
    >(
        item.allocations.length > 0
            ? item.allocations.map((a) => ({
                budgetLineId: a.budgetLineId,
                amount: String(a.amount),
                notes: a.notes ?? "",
            }))
            : [{ budgetLineId: "", amount: String(item.lineAmount), notes: "" }]
    );

    function updateRow(index: number, patch: Partial<{ budgetLineId: string; amount: string; notes?: string }>) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    function addRow() {
        setRows((prev) => [...prev, { budgetLineId: "", amount: "", notes: "" }]);
    }

    function removeRow(index: number) {
        setRows((prev) => prev.filter((_, i) => i !== index));
    }

    function saveAllocations() {
        const payload = {
            expenseItemId: item.id,
            allocations: rows
                .filter((r) => r.budgetLineId && r.amount.trim())
                .map((r) => ({
                    budgetLineId: r.budgetLineId,
                    amount: r.amount.trim(),
                    notes: r.notes?.trim() || undefined,
                })),
        };

        if (payload.allocations.length === 0) {
            setMsg("Debes agregar al menos una asignación.");
            return;
        }

        startTransition(async () => {
            const res = await saveProjectExpenseAllocationsAction(projectId, expenseId, payload);
            if (!res.ok) {
                setMsg(res.message);
                return;
            }
            setMsg("Asignaciones guardadas.");
            onReload?.();
        });
    }

    function autofillLineAmount(nextQuantity: string, nextUnitPrice: string) {
        const q = Number(nextQuantity);
        const u = Number(nextUnitPrice);

        if (Number.isFinite(q) && q > 0 && Number.isFinite(u) && u >= 0) {
            setEditLineAmount(String(Number((q * u).toFixed(2))));
        }
    }

    function saveItem() {
        if (!editDescription.trim()) {
            setMsg("La descripción es requerida.");
            return;
        }

        const amount = Number(editLineAmount.trim());
        if (!Number.isFinite(amount) || amount <= 0) {
            setMsg("El valor de la línea debe ser mayor a 0.");
            return;
        }

        const fd = new FormData();
        fd.set("description", editDescription.trim());
        if (editQuantity.trim()) fd.set("quantity", editQuantity.trim());
        if (editUnitPrice.trim()) fd.set("unitPrice", editUnitPrice.trim());
        fd.set("lineAmount", editLineAmount.trim());
        if (editCategory) fd.set("category", editCategory);
        if (editRawExtractedText.trim()) fd.set("rawExtractedText", editRawExtractedText.trim());

        startTransition(async () => {
            const res = await updateProjectExpenseItemAction(projectId, expenseId, item.id, fd);
            if (!res.ok) {
                setMsg(res.message);
                return;
            }

            setMsg("Ítem actualizado.");
            setEditing(false);
            onReload?.();
        });
    }

    function deleteItem() {
        if (!confirm(`¿Eliminar el ítem "${item.description}"?`)) return;

        startTransition(async () => {
            const res = await deleteProjectExpenseItemAction(projectId, expenseId, item.id);
            if (!res.ok) {
                setMsg(res.message);
                return;
            }

            setMsg("Ítem eliminado.");
            onReload?.();
        });
    }

    return (
        <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 overflow-hidden">
            <div className="px-4 py-4 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            #{item.lineNo} • {item.description}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Categoría: {item.category ?? "—"} • Cantidad: {item.quantity ?? "—"} • Unitario:{" "}
                            {item.unitPrice != null ? money(item.unitPrice, currencyCode) : "—"}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-right">
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Línea</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                {money(item.lineAmount, currencyCode)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Asignado</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                {money(item.allocatedAmount, currencyCode)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Pendiente</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                {money(item.pendingAmount, currencyCode)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setEditing((v) => !v)}
                        className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                    >
                        {editing ? "Cerrar edición" : "Editar"}
                    </button>

                    <button
                        type="button"
                        onClick={deleteItem}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                    >
                        Eliminar
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {editing ? (
                    <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Editar ítem
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Descripción
                                </label>
                                <input
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.currentTarget.value)}
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Cantidad
                                </label>
                                <input
                                    value={editQuantity}
                                    onChange={(e) => {
                                        const next = e.currentTarget.value;
                                        setEditQuantity(next);
                                        autofillLineAmount(next, editUnitPrice);
                                    }}
                                    inputMode="decimal"
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Valor unitario
                                </label>
                                <input
                                    value={editUnitPrice}
                                    onChange={(e) => {
                                        const next = e.currentTarget.value;
                                        setEditUnitPrice(next);
                                        autofillLineAmount(editQuantity, next);
                                    }}
                                    inputMode="decimal"
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Valor línea
                                </label>
                                <input
                                    value={editLineAmount}
                                    onChange={(e) => setEditLineAmount(e.currentTarget.value)}
                                    inputMode="decimal"
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Categoría
                                </label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.currentTarget.value)}
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                >
                                    <option value="">(Opcional) Sin categoría</option>
                                    {Object.values(CostCategory).map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-8">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Texto OCR crudo
                                </label>
                                <input
                                    value={editRawExtractedText}
                                    onChange={(e) => setEditRawExtractedText(e.currentTarget.value)}
                                    className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={saveItem}
                                disabled={pending}
                                className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                            >
                                {pending ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="space-y-3">
                    {rows.map((row, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <select
                                value={row.budgetLineId}
                                onChange={(e) => updateRow(index, { budgetLineId: e.target.value })}
                                className="md:col-span-6 rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                            >
                                <option value="">Selecciona línea presupuestal</option>
                                {budgetLines.map((line) => (
                                    <option key={line.id} value={line.id}>
                                        {line.code} • {line.title}
                                    </option>
                                ))}
                            </select>

                            <input
                                value={row.amount}
                                onChange={(e) => updateRow(index, { amount: e.target.value })}
                                inputMode="decimal"
                                placeholder="Monto"
                                className="md:col-span-3 rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                            />

                            <input
                                value={row.notes ?? ""}
                                onChange={(e) => updateRow(index, { notes: e.target.value })}
                                placeholder="Notas (opcional)"
                                className="md:col-span-2 rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                            />

                            <button
                                type="button"
                                onClick={() => removeRow(index)}
                                className="md:col-span-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        onClick={addRow}
                        className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                    >
                        Agregar asignación
                    </button>

                    <button
                        type="button"
                        onClick={saveAllocations}
                        disabled={pending}
                        className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                    >
                        {pending ? "Guardando..." : "Guardar asignaciones"}
                    </button>
                </div>

                {msg ? (
                    <div className="rounded-lg border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/20 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                        {msg}
                    </div>
                ) : null}
            </div>
        </div>
    );
}