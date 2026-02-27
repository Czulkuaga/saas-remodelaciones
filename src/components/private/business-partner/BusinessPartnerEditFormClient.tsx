"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBusinessPartnerAction } from "@/action/business-partner/business-partner";
import { PartnerType } from "../../../../generated/prisma/enums";

type BP = {
    id: string;
    code: string;
    type: PartnerType;
    organizationName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
};

export function BusinessPartnerEditFormClient({ initial }: { initial: BP }) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [type, setType] = useState<PartnerType>(initial.type);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget); // ✅ aquí está la clave

        setMsg(null);
        setIsSaving(true);

        try {
            const input = {
                id: initial.id,
                type,
                organizationName: String(formData.get("organizationName") ?? ""),
                firstName: String(formData.get("firstName") ?? ""),
                lastName: String(formData.get("lastName") ?? ""),
                email: String(formData.get("email") ?? ""),
                phone: String(formData.get("phone") ?? ""),
                isActive: formData.has("isActive"), // ✅ checkbox correcto
            };

            const res = await updateBusinessPartnerAction(input);

            if (!res.ok) {
                setMsg({ type: "error", text: res.message });
                return;
            }

            router.push(`/business-partner/${initial.id}`);
            // opcional si esa página es SSR y quieres forzar refresh:
            // router.refresh();
        } catch {
            setMsg({ type: "error", text: "Error inesperado guardando cambios." });
        } finally {
            setIsSaving(false);
        }
    }

    const showOrg = type === "ORGANIZATION";
    const showPerson = type === "PERSON";

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
                <h3 className="font-bold text-sm">Editar BP {initial.code}</h3>
            </div>

            <form onSubmit={e => onSubmit(e)} className="p-6">
                {msg && (
                    <div
                        className={[
                            "mb-6 rounded-xl border px-4 py-3 text-sm",
                            msg.type === "success"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : "border-rose-500/20 bg-rose-500/10 text-rose-200",
                        ].join(" ")}
                    >
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as PartnerType)}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                        >
                            <option value="ORGANIZATION">Organización</option>
                            <option value="PERSON">Persona</option>
                        </select>
                    </div>

                    {/* Active */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Estado</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Disponible para operación.</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input name="isActive" type="checkbox" defaultChecked={initial.isActive} className="size-4 accent-fuchsia-500" />
                            <span className="text-slate-700 dark:text-slate-200">Activo</span>
                        </label>
                    </div>

                    {/* ORG */}
                    {showOrg && (
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Razón social
                            </label>
                            <input
                                name="organizationName"
                                defaultValue={initial.organizationName ?? ""}
                                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* PERSON */}
                    {showPerson && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</label>
                                <input
                                    name="firstName"
                                    defaultValue={initial.firstName ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Apellido</label>
                                <input
                                    name="lastName"
                                    defaultValue={initial.lastName ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={initial.email ?? ""}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</label>
                        <input
                            name="phone"
                            defaultValue={initial.phone ?? ""}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/business-partner/${initial.id}`)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                    >
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}