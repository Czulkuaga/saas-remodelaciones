"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    archiveProjectAction,
    unarchiveProjectAction,
    setProjectStatusAction,
    softDeleteProjectAction,
} from "@/action/projects/projects"; // 👈 IMPORTA DESDE DONDE LOS TENGAS HOY

type Props = {
    projectId: string;
    status: string;
    archivedAt?: Date | null;
    deletedAt?: Date | null;
};

const STATUS_OPTIONS = [
    { key: "PLANNING", label: "Planning" },
    { key: "IN_PROGRESS", label: "En progreso" },
    { key: "ON_HOLD", label: "En pausa" },
    { key: "COMPLETED", label: "Completado" },
    { key: "CANCELED", label: "Cancelado" },
] as const;

function tone(type: "success" | "error") {
    return type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        : "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

export function ProjectHeaderActionsClient({ projectId, status, archivedAt, deletedAt }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isArchived = !!archivedAt;
    const isDeleted = !!deletedAt;

    const containerRef = useRef<HTMLDivElement | null>(null);

    function flash(type: "success" | "error", text: string, ms = 1400) {
        setMsg({ type, text });
        window.setTimeout(() => setMsg(null), ms);
    }

    function run(fn: () => Promise<{ ok: boolean; message?: string }>, okText: string) {
        startTransition(async () => {
            const res = await fn();
            if (!res.ok) return flash("error", res.message ?? "Error");
            flash("success", okText);
            setOpen(false);
            router.refresh();
        });
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!open) return;

            const target = event.target as Node;
            if (containerRef.current && !containerRef.current.contains(target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        function handleEsc(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative flex items-center gap-2">
            {msg ? (
                <span className={["text-[11px] px-2 py-1 rounded-full border", tone(msg.type)].join(" ")}>
                    {msg.text}
                </span>
            ) : null}

            <button
                type="button"
                disabled={pending}
                onClick={() => setOpen((v) => !v)}
                className="rounded-lg px-4 py-2 text-sm font-bold border border-fuchsia-500/30 text-slate-700 dark:text-slate-200 hover:bg-fuchsia-500/5 disabled:opacity-60 cursor-pointer"
            >
                Acciones
            </button>

            {open ? (
                <div className="absolute right-0 top-11 w-90 rounded-xl border border-fuchsia-500/20 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-20">
                    <div className="px-4 py-3 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Acciones del proyecto</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isDeleted ? "Eliminado (soft)" : isArchived ? "Archivado" : "Operativo"}
                        </p>
                    </div>

                    {/* STATUS */}
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</p>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((x) => {
                                const active = status === x.key;
                                const disabled = pending || isDeleted || isArchived;

                                return (
                                    <button
                                        key={x.key}
                                        type="button"
                                        disabled={disabled || active}
                                        onClick={() => run(() => setProjectStatusAction(projectId, x.key), `Estado cambiado a ${x.label}`)}
                                        className={[
                                            "text-xs font-bold px-3 py-2 rounded-lg border transition text-left cursor-pointer",
                                            active
                                                ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-200"
                                                : "border-fuchsia-500/10 bg-slate-950/5 text-slate-700 dark:text-slate-200 hover:bg-slate-950/10",
                                            disabled ? "opacity-60 cursor-not-allowed" : "",
                                        ].join(" ")}
                                        title={isDeleted ? "Proyecto eliminado" : isArchived ? "Desarchiva para modificar" : ""}
                                    >
                                        {x.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-fuchsia-500/10" />

                    {/* ARCHIVE */}
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archivado</p>

                        {!isArchived ? (
                            <button
                                type="button"
                                disabled={pending || isDeleted}
                                onClick={() => {
                                    if (!confirm("¿Archivar proyecto?")) return;
                                    run(() => archiveProjectAction(projectId), "Proyecto archivado");
                                }}
                                className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200 hover:bg-slate-500/15 disabled:opacity-60 text-left cursor-pointer"
                            >
                                Archivar
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={pending || isDeleted}
                                onClick={() => run(() => unarchiveProjectAction(projectId), "Proyecto desarchivado")}
                                className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60 text-left cursor-pointer"
                            >
                                Desarchivar
                            </button>
                        )}
                    </div>

                    <div className="h-px bg-fuchsia-500/10" />

                    {/* SOFT DELETE */}
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peligro</p>

                        <button
                            type="button"
                            disabled={pending || isDeleted}
                            onClick={() => {
                                const reason = prompt("Motivo (opcional) para el soft delete:");
                                if (!confirm("¿Eliminar este proyecto?")) return;
                                run(() => softDeleteProjectAction(projectId, reason ?? undefined), "Proyecto eliminado");
                            }}
                            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 disabled:opacity-60 text-left cursor-pointer"
                        >
                            Eliminar
                        </button>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Se bloquea automáticamente si el proyecto tiene tareas/presupuestos/movimientos (según tu gate).
                        </p>
                    </div>

                    <div className="px-4 py-3 border-t border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-xs font-bold px-3 py-1.5 rounded-md border border-fuchsia-500/20 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 hover:bg-white/20 cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}