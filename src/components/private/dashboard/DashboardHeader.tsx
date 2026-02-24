export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
      {subtitle ? <p className="text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
