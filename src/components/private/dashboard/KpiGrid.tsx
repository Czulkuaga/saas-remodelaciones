import { KpiCard, type KpiCardItem } from "./KpiCard";

export function KpiGrid({ items }: { items: KpiCardItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {items.map((it, idx) => (
        <KpiCard key={`${it.title}-${idx}`} item={it} />
      ))}
    </div>
  );
}
