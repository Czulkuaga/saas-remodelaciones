import type { BusinessPartnerKpisDTO } from "@/types/business-partner/types";

export default function BusinessPartnerKpis({ kpis }: { kpis: BusinessPartnerKpisDTO }) {
  const cards = [
    { label: "Total", value: kpis.total },
    { label: "Activos", value: kpis.active },
    { label: "Organizaciones", value: kpis.organizations },
    { label: "Personas", value: kpis.persons },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-fuchsia-500/20 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-100 font-bold">{c.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-700 dark:text-slate-100">{c.value}</p>
        </div>
      ))}
    </div>
  );
}