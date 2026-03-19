"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction } from "@/action/projects/projects";
import type { TenantSettingsDTO } from "@/types/settings/types";
import Link from "next/link";

type PartnerPick = {
    id: string;
    code: string;
    type: "PERSON" | "ORGANIZATION";
    organizationName: string | null;
    firstName: string | null;
    lastName: string | null;
};

function partnerLabel(p: PartnerPick) {
    if (p.organizationName) return p.organizationName;

    const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;

    return p.code;
}

export function ProjectCreateFormClient({ settings, partners }: { settings: TenantSettingsDTO; partners: PartnerPick[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<string | null>(null);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                setMsg(null);
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                    const res = await createProjectAction(fd);
                    if (!res.ok) {
                        setMsg(res.message);
                        return;
                    }
                    router.push(`/projects/${res.id}`);
                });
            }}
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm p-6"
        >
            {msg && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</label>
                    <input
                        name="name"
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        placeholder="Ej: Remodelación Cocina - Apt 402"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resumen de alcance</label>
                    <textarea
                        name="scopeSummary"
                        rows={3}
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none"
                        placeholder="Cocina + baños + acabados..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente (BP)</label>
                    <select
                        name="clientPartnerId"
                        defaultValue=""
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        <option value="">(Opcional)</option>
                        {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {partnerLabel(p)} [{p.code}]
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dirección del inmueble</p>
                </div>

                <div className="md:col-span-2">
                    <input
                        name="addressLine1"
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        placeholder="Calle 00 #00-00"
                    />
                </div>

                <div>
                    <input
                        name="city"
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        placeholder="Ciudad"
                    />
                </div>

                <div>
                    <input
                        name="postalCode"
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        placeholder="Postal"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">País</label>
                    <select
                        name="countryCode"
                        defaultValue={settings.countryCode ?? ""}
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        <option value="">(Opcional)</option>
                        {settings.countries.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name} ({c.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inicio</label>
                    <input
                        name="startDate"
                        type="date"
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fin objetivo</label>
                    <input
                        name="targetEndDate"
                        type="date"
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <Link href={"/projects"} className="border rounded-md px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-400 cursor-pointer">
                    Cancelar
                </Link>
                <button
                    disabled={pending}
                    className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                    {pending ? "Creando..." : "Crear Proyecto"}
                </button>
            </div>
        </form>
    );
}