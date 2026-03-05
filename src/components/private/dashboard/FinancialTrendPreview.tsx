"use client";

import type { FinancialTrendPoint } from "@/action/dashboard/dashboard-actions";

export function FinancialTrendPreview({ points }: { points: FinancialTrendPoint[] }) {
    // mostramos últimos 7 puntos para no saturar
    const slice = points.slice(-7);

    return (
        <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
            <div className="mb-3">
                <div className="text-sm font-bold text-slate-100">Tendencia financiera</div>
                <div className="text-xs text-slate-400">Costos, compromisos, ingresos y margen por día.</div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="text-slate-400">
                        <tr className="text-left">
                            <th className="py-2 pr-4">Día</th>
                            <th className="py-2 pr-4">Costos</th>
                            <th className="py-2 pr-4">Comp.</th>
                            <th className="py-2 pr-4">Ingresos</th>
                            <th className="py-2 pr-0">Margen</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {slice.map((p) => (
                            <tr key={p.label} className="border-t border-slate-200/10">
                                <td className="py-2 pr-4">{p.label}</td>
                                <td className="py-2 pr-4">{p.costs.toLocaleString("es-CO")}</td>
                                <td className="py-2 pr-4">{p.commitments.toLocaleString("es-CO")}</td>
                                <td className="py-2 pr-4">{p.revenues.toLocaleString("es-CO")}</td>
                                <td className={["py-2 pr-0 font-semibold", p.margin < 0 ? "text-rose-300" : "text-emerald-300"].join(" ")}>
                                    {p.margin.toLocaleString("es-CO")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}