"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureOrgBillingLocationAction } from "@/action/ensure-org-billing-location";
import { updateOrgBillingLocationAction } from "@/action/update-org-billing-location";
import type { TenantSettingsDTO } from "@/types/settings/types";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function TenantOrgBillingAddressFormClient({ initial }: { initial: TenantSettingsDTO }) {
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const org = initial.orgBP;
    const loc = initial.orgBillingLocation;

    async function submit(formData: FormData) {
        setMsg(null);
        const res = await updateOrgBillingLocationAction(formData);

        if (!res.ok) {
            setMsg({ type: "error", text: res.message });
            return;
        }

        setMsg({ type: "success", text: "Dirección fiscal guardada correctamente." });
        setTimeout(() => setMsg(null), 2000);
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-fuchsia-500" />
                    <h3 className="font-bold text-sm">Dirección Fiscal (BILLING)</h3>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {loc ? (
                        <span className="font-semibold text-emerald-500">Configurada</span>
                    ) : (
                        <span className="font-semibold text-slate-400">Sin dirección</span>
                    )}
                </div>
            </div>

            <div className="p-6">
                {!org ? (
                    <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 text-sm text-slate-600 dark:text-slate-300">
                        Primero crea la empresa (BP principal) para registrar la dirección fiscal.
                    </div>
                ) : !loc ? (
                    <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 text-sm text-slate-600 dark:text-slate-300">
                        No hay dirección fiscal asignada. Puedes crearla desde aquí.
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                disabled={pending}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600"
                                onClick={() => {
                                    startTransition(async () => {
                                        const res = await ensureOrgBillingLocationAction();
                                        if (res.ok) router.refresh();
                                        // opcional toast
                                    });
                                }}
                            >
                                {pending ? "Creando..." : "Crear Dirección Fiscal"}
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
                            <input type="hidden" name="locationId" value={loc.id} />
                            {/* Nombre sede */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Nombre de la sede
                                </label>
                                <input
                                    name="locationName"
                                    defaultValue={loc.name ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    placeholder="Ej: Sede Principal"
                                />
                            </div>

                            {/* Address 1 */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Dirección (Línea 1)
                                </label>
                                <input
                                    name="addressLine1"
                                    defaultValue={loc.addressLine1 ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>

                            {/* Address 2 */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Dirección (Línea 2)
                                </label>
                                <input
                                    name="addressLine2"
                                    defaultValue={loc.addressLine2 ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>

                            {/* City */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Ciudad
                                </label>
                                <input
                                    name="city"
                                    defaultValue={loc.city ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>

                            {/* State */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Departamento / Estado
                                </label>
                                <input
                                    name="state"
                                    defaultValue={loc.state ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>

                            {/* Postal */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Código postal
                                </label>
                                <input
                                    name="postalCode"
                                    defaultValue={loc.postalCode ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>

                            {/* Country */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    País
                                </label>
                                <select
                                    name="countryCode"
                                    defaultValue={loc.countryCode ?? ""}
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none"
                                >
                                    <option value="">(Sin país)</option>
                                    {initial.countries.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Contact */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Contacto
                                    </label>
                                    <input
                                        name="contactName"
                                        defaultValue={loc.contactName ?? ""}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Teléfono
                                    </label>
                                    <input
                                        name="contactPhone"
                                        defaultValue={loc.contactPhone ?? ""}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Email
                                    </label>
                                    <input
                                        name="contactEmail"
                                        type="email"
                                        defaultValue={loc.contactEmail ?? ""}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                    />
                                </div>
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
                                    "Guardar Dirección Fiscal"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}