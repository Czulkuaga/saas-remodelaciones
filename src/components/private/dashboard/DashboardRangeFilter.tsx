"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
    { key: "today", label: "Hoy" },
    { key: "7d", label: "7 días" },
    { key: "30d", label: "1 mes" },
] as const;

export function DashboardRangeFilter({ value }: { value: "today" | "7d" | "30d" }) {
    const router = useRouter();
    const sp = useSearchParams();

    return (
        <div className="flex items-center gap-2">
            {OPTIONS.map((o) => {
                const active = o.key === value;
                return (
                    <button
                        key={o.key}
                        onClick={() => {
                            const next = new URLSearchParams(sp.toString());
                            next.set("range", o.key);
                            router.push(`/dashboard?${next.toString()}`);
                        }}
                        className={[
                            "px-3 py-1.5 rounded-xl text-sm font-semibold border transition",
                            active
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30",
                        ].join(" ")}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}