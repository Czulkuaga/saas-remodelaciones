"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleBusinessPartnerActiveAction } from "@/action/business-partner/business-partner";
import type { BusinessPartnerListItem } from "@/types/business-partner/types";
import { MdHideSource, MdOutlineModeStandby, MdOutlineStreetview } from "react-icons/md";
import { SimpleTooltip } from "@/components/ui/SimpleTooltip"

function badge(active: boolean) {
    return active
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
        : "bg-slate-500/10 text-slate-700 dark:text-slate-100 border-slate-500/20";
}

function typeBadge(type: BusinessPartnerListItem["type"]) {
    return type === "ORGANIZATION"
        ? "bg-indigo-500 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-200 border-indigo-500/20"
        : "bg-fuchsia-500/40 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-200 border-fuchsia-500/20";
}

function typeLabel(type: BusinessPartnerListItem["type"]) {
    return type === "ORGANIZATION" ? "Organización" : "Persona";
}

export default function BusinessPartnerTable({ items }: { items: BusinessPartnerListItem[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [rowPending, setRowPending] = useState<string | null>(null);

    async function onToggle(id: string) {
        setRowPending(id);
        startTransition(async () => {
            const res = await toggleBusinessPartnerActiveAction(id);
            setRowPending(null);

            if (!res.ok) {
                // por ahora simple, luego lo cambiamos por toast
                alert(res.message);
                return;
            }

            // refresca SSR data del listado
            router.refresh();
        });
    }

    return (
        <div className="rounded-2xl border border-fuchsia-500/20 bg-white dark:bg-slate-900/40 overflow-hidden">
            <div className="px-5 py-4 border-b border-fuchsia-500/10 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-100">Listado</p>
                <p className="text-xs text-slate-700 dark:text-slate-100">{items.length} resultados</p>
            </div>

            {items.length === 0 ? (
                <div className="p-6 text-sm text-slate-700 dark:text-slate-300">No hay terceros para mostrar con estos filtros.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-slate-700 dark:text-slate-100">
                            <tr className="border-b border-fuchsia-900/10">
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Código</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Nombre</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Tipo</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Contacto</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Proyectos</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Estado</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Acción</th>
                            </tr>
                        </thead>

                        <tbody className="text-slate-700 dark:text-slate-200">
                            {items.map((x) => (
                                <tr key={x.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-5 py-3 font-mono text-xs text-fuchsia-600 dark:text-fuchsia-300">{x.code}</td>

                                    <td className="px-5 py-3 font-semibold">
                                        <Link
                                            href={`/business-partner/${x.id}`}
                                            className="hover:text-fuchsia-200"
                                            prefetch
                                        >
                                            {x.displayName}
                                        </Link>
                                    </td>

                                    <td className="px-5 py-3">
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold",
                                                typeBadge(x.type),
                                            ].join(" ")}
                                        >
                                            {typeLabel(x.type)}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3 text-slate-700 dark:text-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs">{x.email ?? "—"}</span>
                                            <span className="text-xs">{x.phone ?? "—"}</span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                        <span
                                            className="font-bold text-slate-700 dark:text-slate-100"
                                            title={`Owner: ${x.projectsAsOwner} • Equipo: ${x.projectsAsTeam}`}
                                        >
                                            {x.projectsCount}
                                        </span>

                                        {(x.projectsAsTeam ?? 0) > 0 && (
                                            <span
                                                className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/80 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-200"
                                                title={`Este BP está asignado como equipo en ${x.projectsAsTeam} proyecto(s).`}
                                            >
                                                TEAM
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-5 py-3 text-right">
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold",
                                                badge(x.isActive),
                                            ].join(" ")}
                                        >
                                            {x.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>

                                    <td className="px-3 py-3 text-right">
                                        <div className="inline-flex items-center gap-3">
                                            <SimpleTooltip text="Ver BP">
                                                <Link
                                                    href={`/business-partner/${x.id}`}
                                                    className="text-fuchsia-600 hover:text-fuchsia-500 font-bold dark:text-fuchsia-200 dark:hover:text-fuchsia-600"
                                                >
                                                    <MdOutlineStreetview size={18} />
                                                </Link>
                                            </SimpleTooltip>

                                            <SimpleTooltip text={x.isActive ? "Deshabilitar" : "Habilitar"}>
                                            <button
                                                type="button"
                                                onClick={() => onToggle(x.id)}
                                                disabled={pending && rowPending === x.id}
                                                className="text-xs font-bold text-slate-700 hover:text-slate-500 disabled:opacity-60 dark:text-slate-100 dark:hover:text-slate-200 cursor-pointer"
                                                title={x.isActive ? "Desactivar" : "Activar"}
                                            >
                                                {pending && rowPending === x.id
                                                    ? "..."
                                                    : x.isActive
                                                        ? <MdHideSource size={18} />
                                                        : <MdOutlineModeStandby size={18} />}
                                            </button>
                                            </SimpleTooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(pending && rowPending) && (
                        <div className="px-5 py-3 text-xs text-slate-400 border-t border-fuchsia-500/10">
                            Actualizando…
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}