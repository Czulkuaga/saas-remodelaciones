"use client";

import { ReactNode, useEffect } from "react";

export function ProjectExpenseCreateModal({
    open,
    title,
    subtitle,
    children,
    onClose,
}: {
    open: boolean;
    title: string;
    subtitle?: string;
    children: ReactNode;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100">
            <div
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-fuchsia-500/20 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                    <div className="flex items-start justify-between gap-4 border-b border-fuchsia-500/10 px-5 py-4 bg-slate-50 dark:bg-slate-950/20">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {title}
                            </h3>
                            {subtitle ? (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-fuchsia-500/20 bg-white dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="px-5 py-5">{children}</div>
                </div>
            </div>
        </div>
    );
}