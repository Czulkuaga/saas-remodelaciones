"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Props = LinkProps & {
    icon: React.ReactNode;
    label: string;
    exact?: boolean;
    className?: string;
    activeClassName?: string;
    inactiveClassName?: string;
};

function normalizePath(p: string) {
    if (!p) return "/";
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

export function ActiveNavLink({
    icon,
    label,
    exact,
    className,
    activeClassName,
    inactiveClassName,
    ...props
}: Props) {
    const pathname = usePathname();
    const hrefStr = typeof props.href === "string" ? props.href : props.href.pathname ?? "/";

    const current = normalizePath(pathname ?? "/");
    const target = normalizePath(hrefStr);

    const isActive = exact ? current === target : current === target || current.startsWith(`${target}/`);

    const base = "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors";
    const active = activeClassName ?? "bg-[#13ecda]/10 text-[#13ecda] font-medium";
    const inactive =
        inactiveClassName ??
        "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

    return (
        <Link
            {...props}
            className={[base, isActive ? active : inactive, className].filter(Boolean).join(" ")}
            aria-current={isActive ? "page" : undefined}
        >
            <span className="shrink-0">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}