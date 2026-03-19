"use client";

import { ProjectExpenseStatus } from "../../../../../generated/prisma/enums";

function statusTone(status: ProjectExpenseStatus) {
    switch (status) {
        case "DRAFT":
            return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200";
        case "REVIEW_PENDING":
            return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200";
        case "POSTED":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
        case "CANCELLED":
            return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200";
        default:
            return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200";
    }
}

function label(status: ProjectExpenseStatus) {
    switch (status) {
        case "DRAFT":
            return "Borrador";
        case "REVIEW_PENDING":
            return "Por revisar";
        case "POSTED":
            return "Confirmado";
        case "CANCELLED":
            return "Cancelado";
        default:
            return status;
    }
}

export function ProjectExpenseStatusBadge({
    status,
}: {
    status: ProjectExpenseStatus;
}) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                statusTone(status),
            ].join(" ")}
        >
            {label(status)}
        </span>
    );
}