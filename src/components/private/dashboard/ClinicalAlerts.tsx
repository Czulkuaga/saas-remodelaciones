export type AlertTone = "amber" | "primary" | "red" | "blue";

export type AlertItem = {
  tone: AlertTone;
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
};

function toneStyles(tone: AlertTone) {
  switch (tone) {
    case "amber":
      return { border: "border-amber-500", iconWrap: "bg-amber-500/10", icon: "text-amber-500" };
    case "primary":
      return { border: "border-primary", iconWrap: "bg-primary/10", icon: "text-primary" };
    case "red":
      return { border: "border-red-500", iconWrap: "bg-red-500/10", icon: "text-red-500" };
    default:
      return { border: "border-blue-500", iconWrap: "bg-blue-500/10", icon: "text-blue-500" };
  }
}

export function ClinicalAlerts({ count, items }: { count: number; items: AlertItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg">Alertas Operaciones</h3>
        <span className="flex size-6 items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full">
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto md:max-h-250">
        <div className="p-4 space-y-4">
          {items.map((a, idx) => {
            const s = toneStyles(a.tone);
            return (
              <div
                key={`${a.title}-${idx}`}
                className={`flex gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer border-l-4 ${s.border}`}
              >
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${s.iconWrap}`}>
                  <span className={`material-symbols-outlined text-xl ${s.icon}`}>{a.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{a.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{a.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700">
        <button
          className="w-full py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-200"
          type="button"
        >
          Marcar todas como leídas
        </button>
      </div> */}
    </div>
  );
}
