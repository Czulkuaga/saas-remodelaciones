import { getProjectBudgetSummaryAction } from "@/action/projects/project-budget";
import { getProjectAction } from "@/action/projects/projects";
import { ProjectBudgetClient } from "@/components";

function money(n: number, currencyCode?: string | null) {
    const code = currencyCode ?? "—";
    return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${code}`;
}

export default async function ProjectBudgetPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    await getProjectAction(id);

    const s = await getProjectBudgetSummaryAction(id);

    const currency = s.currencyCode;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                    { k: "Plan (Presupuesto)", v: money(s.plannedTotal, currency) },
                    { k: "Comprometido", v: money(s.committedTotal, currency) },
                    { k: "Ejecutado", v: money(s.actualTotal, currency) },
                    { k: "Ingresos", v: money(s.revenueTotal, currency) },
                ].map((x) => (
                    <div
                        key={x.k}
                        className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5"
                    >
                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                            {x.k}
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                            {x.v}
                        </p>
                    </div>
                ))}
            </div>

            {/* Client */}
            <ProjectBudgetClient
                projectId={id}
                currencyCode={s.currencyCode}
                activeBudget={s.activeBudget}
                draftBudget={s.draftBudget}
                lines={s.lines}
            />
        </div>
    );
}