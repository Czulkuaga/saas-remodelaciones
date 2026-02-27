"use client";

import { useEffect, useRef, useState } from "react";
import { addPartnerIdentifierAction } from "@/action/partner-identifiers";
import type { TenantSettingsDTO } from "@/types/settings/types";
import { PartnerIdentifierType } from "../../../../generated/prisma/enums";

type Props = {
    open: boolean;
    onClose: () => void;
    partnerId: string;
    countries: TenantSettingsDTO["countries"];
};

const IDENTIFIER_TYPES: { value: PartnerIdentifierType; label: string }[] = [
    { value: PartnerIdentifierType.CO_NIT, label: "NIT (Colombia)" },
    { value: PartnerIdentifierType.CO_CC, label: "Cédula (Colombia)" },
    { value: PartnerIdentifierType.CO_CE, label: "Cédula Extranjería (Colombia)" },
    { value: PartnerIdentifierType.TAX_ID, label: "Tax ID (Genérico)" },
    { value: PartnerIdentifierType.VAT_ID, label: "VAT (Europa)" },
    { value: PartnerIdentifierType.PASSPORT, label: "Pasaporte" },
    { value: PartnerIdentifierType.OTHER, label: "Otro" },
];

export default function TenantOrgIdentifierModalClient({ open, onClose, partnerId, countries }: Props) {
    const [pending, setPending] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) return;
        setMsg(null);
        setTimeout(() => closeBtnRef.current?.focus(), 0);
    }, [open]);

    if (!open) return null;

    async function submit(formData: FormData) {
        setMsg(null);
        if (pending) return;
        setPending(true);
        try {
            formData.set("partnerId", partnerId);
            const res = await addPartnerIdentifierAction(formData);
            if (!res.ok) {
                setMsg({ type: "error", text: res.message });
                return;
            }
            setMsg({ type: "success", text: "Identificador agregado." });
            setTimeout(() => onClose(), 600);
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50">
            {/* overlay */}
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="absolute inset-0 bg-black/60"
            />

            {/* panel */}
            <div className="absolute left-1/2 top-1/2 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-2xl border border-fuchsia-500/30 bg-slate-950 shadow-xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-fuchsia-500/10">
                        <div>
                            <p className="text-sm font-bold text-slate-100">Agregar identificador</p>
                            <p className="text-xs text-slate-400 mt-0.5">Fiscal / Legal (para la empresa del tenant)</p>
                        </div>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
                        >
                            Cerrar
                        </button>
                    </div>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        await submit(formData);
                    }} className="p-5">
                        {msg && (
                            <div
                                className={[
                                    "mb-4 rounded-xl border px-4 py-3 text-sm",
                                    msg.type === "success"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                        : "border-rose-500/20 bg-rose-500/10 text-rose-200",
                                ].join(" ")}
                            >
                                {msg.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                                <select
                                    name="type"
                                    defaultValue="CO_NIT"
                                    className="bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                                >
                                    {IDENTIFIER_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número</label>
                                <input
                                    name="value"
                                    placeholder="Ej: 800123456-9"
                                    className="bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">País</label>
                                <select
                                    name="countryCode"
                                    defaultValue=""
                                    className="bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                                >
                                    <option value="">(Opcional)</option>
                                    {countries.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-300">
                                <input
                                    name="isPrimary"
                                    type="checkbox"
                                    className="size-4 rounded border-slate-600 bg-slate-900"
                                />
                                Marcar como Primary
                            </label>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={pending}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                            >
                                {pending ? (
                                    <span className="flex items-center gap-2">
                                        <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        Guardando...
                                    </span>
                                ) : (
                                    "Guardar"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}