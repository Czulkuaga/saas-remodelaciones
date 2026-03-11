"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoInfo,
    GoNumber,
    GoTag,
} from "react-icons/go";
import {
    numberRangesSchema,
    type NumberRangesFormValues,
} from "@/lib/zod/onboarding/number-ranges.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type RowErrors = {
    prefix?: string;
    startNumber?: string;
    padding?: string;
};

type FormErrors = {
    ranges?: string;
    rows: Record<number, RowErrors>;
};

const ENTITY_LABELS: Record<string, string> = {
    payment: "Payment",
    invoice: "Invoice",
    quote: "Quote",
    task: "Task",
    change_order: "Change Order",
    remodeling_project: "Remodeling Project",
    location: "Location",
    org_unit: "Org Unit",
    business_partner: "Business Partner",
};

function formatPreview(prefix: string, startNumber: number, padding: number) {
    const number = String(startNumber).padStart(padding, "0");
    return `${prefix}-${number}`;
}

export function NumberRangesForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({ rows: {} });

    const values = useMemo<NumberRangesFormValues>(
        () => ({
            ranges: draft.numberRanges.ranges,
        }),
        [draft.numberRanges.ranges]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function updateRange(
        index: number,
        field: "prefix" | "startNumber" | "padding" | "autoIncrement",
        value: string | number | boolean
    ) {
        updateDraft((prev) => {
            const nextRanges = [...prev.numberRanges.ranges];

            nextRanges[index] = {
                ...nextRanges[index],
                [field]: value,
            };

            return {
                ...prev,
                numberRanges: {
                    ...prev.numberRanges,
                    ranges: nextRanges,
                },
            };
        });

        setErrors((prev) => ({
            ...prev,
            rows: {
                ...prev.rows,
                [index]: {
                    ...prev.rows[index],
                    [field]: undefined,
                },
            },
        }));
    }

    function validateForm() {
        const result = numberRangesSchema.safeParse(values);

        if (result.success) {
            setErrors({ rows: {} });
            return true;
        }

        const nextErrors: FormErrors = {
            rows: {},
        };

        for (const issue of result.error.issues) {
            if (issue.path[0] === "ranges" && typeof issue.path[1] === "number") {
                const rowIndex = issue.path[1];
                const field = issue.path[2] as keyof RowErrors | undefined;

                if (!nextErrors.rows[rowIndex]) {
                    nextErrors.rows[rowIndex] = {};
                }

                if (field && !nextErrors.rows[rowIndex][field]) {
                    nextErrors.rows[rowIndex][field] = issue.message;
                }
            } else if (issue.path[0] === "ranges" && issue.path.length === 1) {
                nextErrors.ranges = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/review");
    }

    function applyDefaults() {
        updateDraft((prev) => ({
            ...prev,
            numberRanges: {
                ...prev.numberRanges,
                ranges: [
                    {
                        entity: "payment",
                        prefix: "PY",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "invoice",
                        prefix: "IV",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "quote",
                        prefix: "QT",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "task",
                        prefix: "TK",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "change_order",
                        prefix: "CO",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "remodeling_project",
                        prefix: "PR",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "location",
                        prefix: "LO",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "org_unit",
                        prefix: "OU",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                    {
                        entity: "business_partner",
                        prefix: "BP",
                        startNumber: 1,
                        padding: 6,
                        autoIncrement: true,
                    },
                ],
            },
        }));

        setErrors({ rows: {} });
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl">
                <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">
                            Configuración por entidad
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Ajusta prefijo, número inicial, longitud y auto incremento.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={applyDefaults}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            Cargar defaults
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-230 text-left">
                        <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-[0.18em] text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Entidad</th>
                                <th className="px-6 py-4">Prefijo</th>
                                <th className="px-6 py-4">Inicial</th>
                                <th className="px-6 py-4">Padding</th>
                                <th className="px-6 py-4 text-center">Auto</th>
                                <th className="px-6 py-4">Preview</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {values.ranges.map((range, index) => {
                                const rowErrors = errors.rows[index] ?? {};
                                const preview = formatPreview(
                                    range.prefix,
                                    Number(range.startNumber || 0),
                                    Number(range.padding || 1)
                                );

                                return (
                                    <tr key={range.entity} className="hover:bg-slate-950/40">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-300">
                                                    <GoTag className="text-base" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-100">
                                                        {ENTITY_LABELS[range.entity] ?? range.entity}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {range.entity}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <input
                                                value={range.prefix}
                                                onChange={(e) =>
                                                    updateRange(index, "prefix", e.target.value.toUpperCase())
                                                }
                                                className={[
                                                    "w-24 rounded-xl border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition",
                                                    rowErrors.prefix
                                                        ? "border-rose-500/50 focus:border-rose-500"
                                                        : "border-slate-800 focus:border-fuchsia-500/40",
                                                ].join(" ")}
                                            />
                                            {rowErrors.prefix ? (
                                                <p className="mt-2 text-xs text-rose-400">
                                                    {rowErrors.prefix}
                                                </p>
                                            ) : null}
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <input
                                                type="number"
                                                value={range.startNumber}
                                                onChange={(e) =>
                                                    updateRange(index, "startNumber", Number(e.target.value))
                                                }
                                                className={[
                                                    "w-28 rounded-xl border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition",
                                                    rowErrors.startNumber
                                                        ? "border-rose-500/50 focus:border-rose-500"
                                                        : "border-slate-800 focus:border-fuchsia-500/40",
                                                ].join(" ")}
                                            />
                                            {rowErrors.startNumber ? (
                                                <p className="mt-2 text-xs text-rose-400">
                                                    {rowErrors.startNumber}
                                                </p>
                                            ) : null}
                                        </td>

                                        <td className="px-6 py-5 align-top">
                                            <select
                                                value={range.padding}
                                                onChange={(e) =>
                                                    updateRange(index, "padding", Number(e.target.value))
                                                }
                                                className={[
                                                    "w-24 rounded-xl border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition",
                                                    rowErrors.padding
                                                        ? "border-rose-500/50 focus:border-rose-500"
                                                        : "border-slate-800 focus:border-fuchsia-500/40",
                                                ].join(" ")}
                                            >
                                                <option value={2}>2</option>
                                                <option value={4}>4</option>
                                                <option value={5}>5</option>
                                                <option value={6}>6</option>
                                                <option value={8}>8</option>
                                            </select>
                                            {rowErrors.padding ? (
                                                <p className="mt-2 text-xs text-rose-400">
                                                    {rowErrors.padding}
                                                </p>
                                            ) : null}
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={range.autoIncrement}
                                                onChange={(e) =>
                                                    updateRange(index, "autoIncrement", e.target.checked)
                                                }
                                                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500"
                                            />
                                        </td>

                                        <td className="px-6 py-5">
                                            <code className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-fuchsia-300">
                                                {preview}
                                            </code>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {errors.ranges ? (
                    <div className="border-t border-slate-800 px-6 py-4">
                        <p className="text-xs text-rose-400">{errors.ranges}</p>
                    </div>
                ) : null}
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <GoNumber className="text-lg text-fuchsia-300" />
                        <h3 className="text-base font-semibold text-slate-100">
                            Smart formatting
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-400">
                        Más adelante podrás enriquecer la numeración con variables como año,
                        sede, unidad organizacional o tipo documental.
                    </p>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <GoInfo className="text-lg text-fuchsia-300" />
                        <h3 className="text-base font-semibold text-slate-100">
                            Reglas futuras
                        </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-400">
                        También podrás definir reglas avanzadas para evitar duplicados,
                        controlar prefijos por contexto y validar consistencia documental.
                    </p>
                </section>
            </div>

            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 text-emerald-400">
                    <GoCheckCircle className="text-lg" />
                    <p className="text-sm font-medium">Numeración válida para continuar</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                    La configuración actual es suficiente para crear los number ranges iniciales del tenant.
                </p>
            </section>

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.push("/onboarding/roles")}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                >
                    Atrás
                </button>

                <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                >
                    Continuar
                    <FaArrowRight size={18}/>
                </button>
            </div>
        </div>
    );
}