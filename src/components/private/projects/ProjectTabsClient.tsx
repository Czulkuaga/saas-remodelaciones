"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabsClient({ projectId }: { projectId: string }) {
    const pathname = usePathname();

    const tabs = [
        { href: `/projects/${projectId}`, label: "Resumen" },
        { href: `/projects/${projectId}/tasks`, label: "Tareas" },
        { href: `/projects/${projectId}/team`, label: "Equipo (BP)" },
        { href: `/projects/${projectId}/budget`, label: "Presupuesto" },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
                const active = pathname === t.href;
                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        className={[
                            "px-4 py-2 rounded-xl text-sm font-bold border transition",
                            active
                                ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-200"
                                : "border-fuchsia-500/20 text-slate-600 dark:text-slate-300 hover:bg-fuchsia-500/5",
                        ].join(" ")}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}