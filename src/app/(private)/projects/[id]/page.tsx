import { getProjectAction } from "@/action/projects/projects";
import { listProjectTimelineAction } from "@/action/projects/project-timeline";

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

function row(label: string, value: React.ReactNode) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-fuchsia-500/10 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectAction(id);
  const timeline = await listProjectTimelineAction(id, 30);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Detalle</h3>
          <div className="mt-4 space-y-1">
            {row("Inicio", fmtDate(project.startDate))}
            {row("Fin objetivo", fmtDate(project.targetEndDate))}
            {row("País", project.country?.name ?? project.countryCode ?? "—")}
            {row("Ciudad", project.city ?? "—")}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dirección</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {project.addressLine1 ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {project.city ?? "—"} {project.postalCode ? `• ${project.postalCode}` : ""}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Alcance</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
            {project.scopeSummary ?? "—"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Timeline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Eventos recientes del proyecto.</p>
          </div>

          <div className="p-5">
            {timeline.length === 0 ? (
              <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 text-sm text-slate-600 dark:text-slate-300">
                Aún no hay eventos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((e) => (
                  <div key={e.id} className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {e.title ?? e.type}
                        </p>
                        {e.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {e.description}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                          {fmtDate(e.createdAt)} • {e.senderKind}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-fuchsia-400">{e.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}