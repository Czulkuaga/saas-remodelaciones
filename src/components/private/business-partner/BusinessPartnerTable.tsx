"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleBusinessPartnerActiveAction } from "@/action/business-partner/business-partner";
import type { BusinessPartnerListItem } from "@/types/business-partner/types";
import { MdHideSource, MdOutlineModeStandby, MdOutlineStreetview } from "react-icons/md";

function badge(active: boolean) {
    return active
        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
        : "bg-slate-500/10 text-slate-300 border-slate-500/20";
}

function typeBadge(type: BusinessPartnerListItem["type"]) {
    return type === "ORGANIZATION"
        ? "bg-indigo-500/10 text-indigo-200 border-indigo-500/20"
        : "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-500/20";
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
        <div className="rounded-2xl border border-fuchsia-500/20 bg-slate-900/40 overflow-hidden">
            <div className="px-5 py-4 border-b border-fuchsia-500/10 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-100">Listado</p>
                <p className="text-xs text-slate-400">{items.length} resultados</p>
            </div>

            {items.length === 0 ? (
                <div className="p-6 text-sm text-slate-300">No hay terceros para mostrar con estos filtros.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-slate-400">
                            <tr className="border-b border-fuchsia-500/10">
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Código</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Nombre</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Tipo</th>
                                <th className="text-left font-bold uppercase tracking-wider text-xs px-5 py-3">Contacto</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Proyectos</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Estado</th>
                                <th className="text-right font-bold uppercase tracking-wider text-xs px-5 py-3">Acción</th>
                            </tr>
                        </thead>

                        <tbody className="text-slate-200">
                            {items.map((x) => (
                                <tr key={x.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-5 py-3 font-mono text-xs text-fuchsia-300">{x.code}</td>

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

                                    <td className="px-5 py-3 text-slate-300">
                                        <div className="flex flex-col">
                                            <span className="text-xs">{x.email ?? "—"}</span>
                                            <span className="text-xs">{x.phone ?? "—"}</span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-3 text-right font-bold">{x.projectsCount}</td>

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

                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-3">
                                            <Link
                                                href={`/business-partner/${x.id}`}
                                                className="text-fuchsia-300 hover:text-fuchsia-200 font-bold"
                                            >
                                                <MdOutlineStreetview size={18}/>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => onToggle(x.id)}
                                                disabled={pending && rowPending === x.id}
                                                className="text-xs font-bold text-slate-300 hover:text-white disabled:opacity-60"
                                                title={x.isActive ? "Desactivar" : "Activar"}
                                            >
                                                {pending && rowPending === x.id
                                                    ? "..."
                                                    : x.isActive
                                                        ? <MdHideSource size={18}/>
                                                        : <MdOutlineModeStandby size={18}/>}
                                            </button>
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