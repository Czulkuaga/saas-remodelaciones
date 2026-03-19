"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectExpenseAction } from "@/action/projects/create-project-expense.action";
import { CostDocType, ProjectPartnerRole } from "../../../../../generated/prisma/enums";

export type TeamPartnerOption = {
    id: string;
    label: string;
    roleLabel?: string;
    isPrimary?: boolean;
};

function tone(type: "success" | "error") {
    return type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200";
}

const EXPENSE_ROLE_LABELS = [
    "CONTRACTOR",
    "ARCHITECT",
    "ENGINEER",
    "SUPPLIER",
    "STAFF",
];

export function ProjectExpenseCreateForm({
    projectId,
    currencyCode,
    teamPartners,
    onCreated,
    onCancel,
}: {
    projectId: string;
    currencyCode: string | null;
    teamPartners?: TeamPartnerOption[];
    onCreated?: (expenseId: string) => void;
    onCancel?: () => void;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [partnerId, setPartnerId] = useState("");
    const [docType, setDocType] = useState<CostDocType | "">("");
    const [docNo, setDocNo] = useState("");
    const [docDate, setDocDate] = useState("");
    const [occurredAt, setOccurredAt] = useState("");
    const [subtotalAmount, setSubtotalAmount] = useState("");
    const [taxAmount, setTaxAmount] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [notes, setNotes] = useState("");

    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const partnerOptions = useMemo(() => teamPartners ?? [], [teamPartners]);
    // console.log("BPs", partnerOptions)
    const expensePartnerOptions = useMemo(
        () =>
            partnerOptions.filter((p) =>
                EXPENSE_ROLE_LABELS.includes((p.roleLabel ?? "").toUpperCase())
            ),
        [partnerOptions]
    );

    function setFlash(type: "success" | "error", text: string) {
        setMsg({ type, text });
    }

    function resetForm() {
        setPartnerId("");
        setDocType("");
        setDocNo("");
        setDocDate("");
        setOccurredAt("");
        setSubtotalAmount("");
        setTaxAmount("");
        setTotalAmount("");
        setNotes("");
        setMsg(null);
    }

    function submit() {
        const total = Number(totalAmount.trim());
        if (!Number.isFinite(total) || total <= 0) {
            return setFlash("error", "El total debe ser mayor a 0.");
        }

        const fd = new FormData();
        if (partnerId) fd.set("partnerId", partnerId);
        if (docType) fd.set("docType", docType);
        if (docNo.trim()) fd.set("docNo", docNo.trim());
        if (docDate.trim()) fd.set("docDate", docDate.trim());
        if (occurredAt.trim()) fd.set("occurredAt", occurredAt.trim());
        if (subtotalAmount.trim()) fd.set("subtotalAmount", subtotalAmount.trim());
        if (taxAmount.trim()) fd.set("taxAmount", taxAmount.trim());
        fd.set("totalAmount", totalAmount.trim());
        if (notes.trim()) fd.set("notes", notes.trim());
        fd.set("currencyCode", currencyCode ?? "COP");

        startTransition(async () => {
            const res = await createProjectExpenseAction(projectId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Gasto creado.");
            resetForm();
            router.refresh();

            if (res.expense?.id) {
                onCreated?.(res.expense.id);
            }
        });
    }

    // useEffect(() => {
    //     if (!partnerId) return;
    //     const exists = expensePartnerOptions.some((p) => p.id === partnerId);
    //     if (!exists) setPartnerId("");
    // }, [partnerId, expensePartnerOptions]);

    return (
        <div className="space-y-4">
            {msg ? (
                <div className={["rounded-xl border px-4 py-3 text-sm", tone(msg.type)].join(" ")}>
                    {msg.text}
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Proveedor / tercero
                    </label>
                    <select
                        value={partnerId}
                        onChange={(e) => setPartnerId(e.currentTarget.value)}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                        <option value="">(Opcional) Sin proveedor</option>
                        {expensePartnerOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                                {p.roleLabel ? ` • ${p.roleLabel}` : ""}
                                {p.isPrimary ? " • PRIMARY" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tipo de documento
                    </label>
                    <select
                        value={docType}
                        onChange={(e) => setDocType(e.currentTarget.value as CostDocType | "")}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                        <option value="">Selecciona tipo</option>
                        {Object.values(CostDocType).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Número de documento
                    </label>
                    <input
                        value={docNo}
                        onChange={(e) => setDocNo(e.currentTarget.value)}
                        placeholder="Ej: FAC-10254"
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Fecha del documento <br />
                        (fecha que aparece en la factura)
                    </label>
                    <input
                        type="date"
                        value={docDate}
                        onChange={(e) => setDocDate(e.currentTarget.value)}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Fecha del gasto <br />
                        (cuándo ocurrió realmente en el proyecto)
                    </label>
                    <input
                        type="date"
                        value={occurredAt}
                        onChange={(e) => setOccurredAt(e.currentTarget.value)}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Subtotal
                    </label>
                    <input
                        value={subtotalAmount}
                        onChange={(e) => setSubtotalAmount(e.currentTarget.value)}
                        inputMode="decimal"
                        placeholder={`0 (${currencyCode ?? "COP"})`}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Impuestos
                    </label>
                    <input
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.currentTarget.value)}
                        inputMode="decimal"
                        placeholder={`0 (${currencyCode ?? "COP"})`}
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total del documento
                    </label>
                    <input
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.currentTarget.value)}
                        inputMode="decimal"
                        placeholder={`Ej: 149000 (${currencyCode ?? "COP"})`}
                        className="w-full rounded-xl border border-fuchsia-500/20 bg-white dark:bg-slate-950/30 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Notas
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.currentTarget.value)}
                        rows={4}
                        placeholder="Observaciones del documento o del registro..."
                        className="w-full rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/30 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={pending}
                    className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60 cursor-pointer"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={submit}
                    disabled={pending}
                    className="rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                >
                    {pending ? "Creando..." : "Crear gasto"}
                </button>
            </div>
        </div>
    );
}