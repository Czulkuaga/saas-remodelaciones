"use client";

import React from "react";

export function SimpleTooltip({
    children,
    text,
}: {
    children: React.ReactNode;
    text: string;
}) {
    return (
        <div className="relative group inline-flex">
            {children}

            <div className="
        pointer-events-none
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        whitespace-nowrap
        rounded-md
        bg-slate-900 text-slate-100
        text-xs
        px-2.5 py-1.5
        shadow-lg
        border border-fuchsia-500/20
        z-50
      ">
                {text}
            </div>
        </div>
    );
}