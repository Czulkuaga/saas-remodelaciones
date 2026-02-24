"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ActiveNavLink } from "./ActiveNavLink";
import { FaChevronDown } from "react-icons/fa";
import { useSidebarStore } from "@/store/ui/sidebar-store";

type ChildItem = { key: string; href: string; label: string; icon?: React.ReactNode };
type Section = { title?: string; items: ChildItem[] };
type GroupKey = "organization" | "sessions" | "settings";

export function SidebarGroup({
    groupKey,
    href,
    label,
    icon,
    sections,
    autoOpenOnRoute = true,
}: {
    groupKey: GroupKey;
    href: string;
    label: string;
    icon: React.ReactNode;
    sections: Section[];
    autoOpenOnRoute?: boolean;
}) {
    const pathname = usePathname() ?? "/";
    const isInGroup = pathname === href || pathname.startsWith(`${href}/`);

    const open = useSidebarStore((s) => s.openGroups[groupKey]);
    const toggle = useSidebarStore((s) => s.toggleGroup);
    const setGroup = useSidebarStore((s) => s.setGroup);

    React.useEffect(() => {
        if (autoOpenOnRoute && isInGroup) setGroup(groupKey, true);
    }, [autoOpenOnRoute, isInGroup, setGroup, groupKey]);

    return (
        <div className="space-y-1">
            <div className="flex items-center">
                <div className="flex-1">
                    <ActiveNavLink
                        href={href}
                        icon={icon}
                        label={label}
                        exact={false}
                        className="pr-2"
                        activeClassName="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => toggle(groupKey)}
                    className="ml-1 grid size-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                    aria-label={open ? `Contraer ${label}` : `Expandir ${label}`}
                    aria-expanded={open}
                >
                    <FaChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {open ? (
                <div className="pl-3">
                    <div className="space-y-3 border-l border-slate-200 pl-3 dark:border-slate-800">
                        {sections.map((sec, i) => (
                            <div key={i} className="space-y-1">
                                {sec.title ? (
                                    <div className="px-2 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {sec.title}
                                    </div>
                                ) : null}

                                {sec.items.map((it) => (
                                    <ActiveNavLink
                                        key={it.key}
                                        href={it.href}
                                        icon={it.icon ?? <span className="inline-block size-2 rounded-full bg-slate-400" />}
                                        label={it.label}
                                        className="text-sm"
                                        inactiveClassName="text-slate-600/90 dark:text-slate-300/90 hover:bg-slate-100 dark:hover:bg-slate-900"
                                        activeClassName="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}