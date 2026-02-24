export type KpiCardItem = {
  title: string;
  value: string;
  note?: string;
  noteClassName?: string;
  icon: React.ReactNode;
  iconClass: string;
  iconWrapClass: string;
  badge?: { text: string; icon?: string; className: string };
  progress?: { value: number; barClass: string };
};

export function KpiCard({ item }: { item: KpiCardItem }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${item.iconWrapClass}`}>
          <span className={`material-symbols-outlined ${item.iconClass}`}>{item.icon}</span>
        </div>

        {item.badge ? (
          <span
            className={`text-xs font-bold flex items-center px-2 py-1 rounded-full ${item.badge.className}`}
          >
            {item.badge.icon ? (
              <span className="material-symbols-outlined text-xs mr-1">{item.badge.icon}</span>
            ) : null}
            {item.badge.text}
          </span>
        ) : null}
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.title}</p>
      <h3 className="text-3xl font-black mt-1">{item.value}</h3>

      {item.progress ? (
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-4">
          <div
            className={`${item.progress.barClass} h-full rounded-full`}
            style={{ width: `${item.progress.value}%` }}
          />
        </div>
      ) : item.note ? (
        <p className={`text-xs mt-2 ${item.noteClassName ?? "text-slate-400"}`}>{item.note}</p>
      ) : null}
    </div>
  );
}
