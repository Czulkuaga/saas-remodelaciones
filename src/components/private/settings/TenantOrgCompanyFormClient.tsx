"use client";

import { useState, useTransition } from "react";
import type { TenantSettingsDTO } from "@/types/settings/types";
import { FaBuilding } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ensureTenantOrgBPAction } from "@/action/ensure-tenant-orgbp";
import { updateTenantOrgBPAction } from "@/action/update-tenant-orgbp";

export default function TenantOrgCompanyFormClient({ initial }: { initial: TenantSettingsDTO }) {
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const org = initial.orgBP;

    async function submit(formData: FormData) {
        setMsg(null);
        const res = await updateTenantOrgBPAction(formData);

        if (!res.ok) {
            setMsg({ type: "error", text: res.message });
            return;
        }

        setMsg({ type: "success", text: "Empresa actualizada correctamente." });
        router.refresh();
        setTimeout(() => setMsg(null), 2000);
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaBuilding className="text-fuchsia-500" />
                    <h3 className="font-bold text-sm">Empresa (Entidad Legal)</h3>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-background-dark rounded-lg border border-fuchsia-500/20">
                    <span className="text-[10px] text-fuchsia-500/70 font-bold uppercase">BP:</span>
                    <span className="text-[10px] font-mono font-bold text-fuchsia-500">
                        {org?.code ?? "—"}
                    </span>
                </div>
            </div>

            <div className="p-6">
                {!org ? (
                    <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 text-sm text-slate-600 dark:text-slate-300">
                        Aún no existe la empresa (BP principal) para este tenant.
                        <div className="mt-3 flex items-center justify-end">
                            <button
                                type="button"
                                disabled={pending}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                                onClick={() => {
                                    startTransition(async () => {
                                        const res = await ensureTenantOrgBPAction();
                                        if (res.ok) router.refresh();
                                    });
                                }}
                            >
                                {pending ? "Creando..." : "Crear Empresa (BP)"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        startTransition(async () => submit(fd));
                    }}>
                        {msg && (
                            <div
                                className={[
                                    "mb-6 rounded-xl border px-4 py-3 text-sm",
                                    msg.type === "success"
                                        ? "border-emerald-500/20 bg-emerald-500/10"
                                        : "border-rose-500/20 bg-rose-500/10",
                                ].join(" ")}
                            >
                                {msg.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Razón Social */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Razón social
                                </label>
                                <input
                                    name="organizationName"
                                    defaultValue={org.organizationName ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    placeholder="Ej: Remodelaciones Esmeralda S.A.S."
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Email administrativo
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={org.email ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    placeholder="administracion@empresa.com"
                                />
                            </div>

                            {/* Teléfono */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Teléfono
                                </label>
                                <input
                                    name="phone"
                                    defaultValue={org.phone ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    placeholder="+57 300 000 0000"
                                />
                            </div>

                            {/* Estado */}
                            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        Estado de la empresa
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Activa/inactiva para operación y asignaciones.
                                    </p>
                                </div>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        name="isActive"
                                        type="checkbox"
                                        defaultChecked={org.isActive}
                                        className="size-4 accent-fuchsia-500"
                                    />
                                    <span className="text-slate-700 dark:text-slate-200">
                                        {org.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
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
                                    "Guardar Empresa"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}