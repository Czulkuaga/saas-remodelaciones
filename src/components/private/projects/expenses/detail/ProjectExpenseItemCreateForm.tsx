"use client";

import { useState, useTransition } from "react";
import { createProjectExpenseItemAction } from "@/action/projects/create-project-expense-item.action";
import { CostCategory } from "../../../../../../generated/prisma/enums";

function tone(type: "success" | "error") {
    return type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200";
}

export function ProjectExpenseItemCreateForm({
    projectId,
    expenseId,
    currencyCode,
    onCreated,
}: {
    projectId: string;
    expenseId: string;
    currencyCode: string | null;
    onCreated?: () => void;
}) {
    const [pending, startTransition] = useTransition();

    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [lineAmount, setLineAmount] = useState("");
    const [category, setCategory] = useState<CostCategory | "">("");
    const [rawExtractedText, setRawExtractedText] = useState("");

    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function resetForm() {
        setDescription("");
        setQuantity("");
        setUnitPrice("");
        setLineAmount("");
        setCategory("");
        setRawExtractedText("");
    }

    function setFlash(type: "success" | "error", text: string) {
        setMsg({ type, text });
    }

    function autofillLineAmount(nextQuantity: string, nextUnitPrice: string) {
        const q = Number(nextQuantity);
        const u = Number(nextUnitPrice);

        if (Number.isFinite(q) && q > 0 && Number.isFinite(u) && u >= 0) {
            setLineAmount(String(Number((q * u).toFixed(2))));
        }
    }

    function submit() {
        if (!description.trim()) {
            return setFlash("error", "La descripción es requerida.");
        }

        const amount = Number(lineAmount.trim());
        if (!Number.isFinite(amount) || amount <= 0) {
            return setFlash("error", "El valor de la línea debe ser mayor a 0.");
        }

        const fd = new FormData();
        fd.set("description", description.trim());
        if (quantity.trim()) fd.set("quantity", quantity.trim());
        if (unitPrice.trim()) fd.set("unitPrice", unitPrice.trim());
        fd.set("lineAmount", lineAmount.trim());
        if (category) fd.set("category", category);
        if (rawExtractedText.trim()) fd.set("rawExtractedText", rawExtractedText.trim());

        startTransition(async () => {
            const res = await createProjectExpenseItemAction(projectId, expenseId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Ítem agregado.");
            resetForm();
            onCreated?.();
        });
    }

    return (
        <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Agregar ítem
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Registra cada renglón real del gasto para luego asignarlo a líneas del presupuesto.
                </p>
            </div>

            <div className="p-4 space-y-4">
                {msg ? (
                    <div className={["rounded-xl border px-4 py-3 text-sm", tone(msg.type)].join(" ")}>
                        {msg.text}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Descripción
                        </label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.currentTarget.value)}
                            placeholder="Ej: Pintura blanca corona"
                            className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Cantidad
                        </label>
                        <input
                            value={quantity}
                            onChange={(e) => {
                                const next = e.currentTarget.value;
                                setQuantity(next);
                                autofillLineAmount(next, unitPrice);
                            }}
                            inputMode="decimal"
                            placeholder="Ej: 2"
                            className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Valor unitario
                        </label>
                        <input
                            value={unitPrice}
                            onChange={(e) => {
                                const next = e.currentTarget.value;
                                setUnitPrice(next);
                                autofillLineAmount(quantity, next);
                            }}
                            inputMode="decimal"
                            placeholder={`0 (${currencyCode ?? "COP"})`}
                            className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Valor línea
                        </label>
                        <input
                            value={lineAmount}
                            onChange={(e) => setLineAmount(e.currentTarget.value)}
                            inputMode="decimal"
                            placeholder={`0 (${currencyCode ?? "COP"})`}
                            className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                        />
                    </div>

                    <div className="md:col-span-4">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.currentTarget.value as CostCategory | "")}
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
                            value={rawExtractedText}
                            onChange={(e) => setRawExtractedText(e.currentTarget.value)}
                            placeholder="Opcional: texto tal como vino del OCR"
                            className="w-full rounded-lg border border-fuchsia-500/10 bg-white dark:bg-slate-950/20 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={pending}
                        className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                    >
                        {pending ? "Agregando..." : "Agregar ítem"}
                    </button>
                </div>
            </div>
        </div>
    );
}