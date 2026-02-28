"use client";

import { useMemo, useState, useTransition } from "react";
import { addProjectPartnerAction, removeProjectPartnerAction, setProjectPartnerPrimaryAction } from "@/action/projects/project-team";
import { BPRoleType, ProjectPartnerRole } from "../../../../generated/prisma/enums";
import { useRouter } from "next/navigation";
import { GrCheckbox, GrCheckboxSelected, GrTrash } from "react-icons/gr";
import { SimpleTooltip } from "@/components/ui/SimpleTooltip";

type TeamRow = Awaited<ReturnType<typeof import("@/action/projects/project-team").listProjectPartnersAction>>[number];

type PartnerPick = {
    id: string;
    code: string;
    type: "PERSON" | "ORGANIZATION";
    organizationName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    roles: { role: BPRoleType }[]; // ✅ viene del select
};

const ROLES: { value: ProjectPartnerRole; label: string }[] = [
    { value: ProjectPartnerRole.CLIENT, label: "Cliente" },
    { value: ProjectPartnerRole.CONTRACTOR, label: "Contratista" },
    { value: ProjectPartnerRole.ARCHITECT, label: "Arquitecto" },
    { value: ProjectPartnerRole.ENGINEER, label: "Ingeniero" },
    { value: ProjectPartnerRole.SUPPLIER, label: "Proveedor" },
    { value: ProjectPartnerRole.STAFF, label: "Equipo interno (Staff)" },
];

// ✅ mapeo SAP-like (slot de proyecto -> rol maestro BP)
function mapProjectRoleToBpRole(role: ProjectPartnerRole): BPRoleType {
    switch (role) {
        case ProjectPartnerRole.CLIENT:
            return BPRoleType.CLIENT;
        case ProjectPartnerRole.CONTRACTOR:
            return BPRoleType.CONTRACTOR;
        case ProjectPartnerRole.ARCHITECT:
            return BPRoleType.ARCHITECT;
        case ProjectPartnerRole.ENGINEER:
            return BPRoleType.ENGINEER;
        case ProjectPartnerRole.SUPPLIER:
            return BPRoleType.SUPPLIER;
        case ProjectPartnerRole.STAFF:
            return BPRoleType.STAFF;
        default:
            return BPRoleType.CONTACT; // fallback (no debería pasar)
    }
}

function partnerLabel(p: PartnerPick) {
    if (p.organizationName) return p.organizationName;
    const full = [p.firstName, p.lastName].filter(Boolean).join(" ");
    return full || p.code;
}

export function ProjectTeamClient({
    projectId,
    initialTeam,
    partners,
}: {
    projectId: string;
    initialTeam: TeamRow[];
    partners: PartnerPick[];
}) {
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();

    // ✅ rol seleccionado para filtrar BPs
    const [selectedRole, setSelectedRole] = useState<ProjectPartnerRole>(ProjectPartnerRole.CONTRACTOR);

    const requiredBpRole = useMemo(() => mapProjectRoleToBpRole(selectedRole), [selectedRole]);

    const filteredPartners = useMemo(() => {
        return partners.filter((p) => p.roles?.some((r) => r.role === requiredBpRole));
    }, [partners, requiredBpRole]);

    const byRole = useMemo(() => {
        const m = new Map<string, TeamRow[]>();
        for (const r of ROLES) m.set(r.value, []);
        for (const row of initialTeam) (m.get(row.role) ?? m.set(row.role, []).get(row.role)!)?.push(row);
        return m;
    }, [initialTeam]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Equipo del proyecto</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Agrega Business Partners por rol y marca primary por rol.
                        </p>
                    </div>

                    {msg && (
                        <span
                            className={[
                                "text-xs font-semibold px-3 py-1 rounded-full border",
                                msg.type === "success"
                                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                                    : "text-rose-200 bg-rose-500/10 border-rose-500/20",
                            ].join(" ")}
                        >
                            {msg.text}
                        </span>
                    )}
                </div>

                <form
                    className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setMsg(null);
                        const fd = new FormData(e.currentTarget);
                        startTransition(async () => {
                            const res = await addProjectPartnerAction(projectId, fd);
                            if (!res.ok) {
                                setMsg({ type: "error", text: res.message });
                                return;
                            }
                            setMsg({ type: "success", text: "Agregado." });
                            setTimeout(() => setMsg(null), 800);
                            router.refresh();
                        });
                    }}
                >
                    <select
                        name="role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as ProjectPartnerRole)}
                        className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>

                    <select
                        name="partnerId"
                        defaultValue=""
                        className="md:col-span-3 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        <option value="">
                            {filteredPartners.length ? "Selecciona un BP" : "No hay BPs con ese rol"}
                        </option>

                        {filteredPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {partnerLabel(p)} [{p.code}]
                            </option>
                        ))}
                    </select>

                    <label className="md:col-span-1 flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 px-3">
                        <input name="isPrimary" type="checkbox" className="size-4 accent-fuchsia-500" />
                        Primary
                    </label>

                    <div className="md:col-span-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={pending}
                            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                        >
                            {pending ? "Guardando..." : "Agregar"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ROLES.map((r) => {
                    const items = byRole.get(r.value) ?? [];
                    return (
                        <div key={r.value} className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/30 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5 flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.label}</p>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{items.length}</span>
                            </div>

                            <div className="p-3 space-y-3">
                                {items.length === 0 ? (
                                    <div className="rounded-xl border border-fuchsia-500/10 bg-fuchsia-500/5 p-3 text-xs text-slate-700 dark:text-slate-400">
                                        Sin partners.
                                    </div>
                                ) : (
                                    items.map((x) => (
                                        <div key={x.id} className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                {/* LEFT CONTENT */}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
                                                        <span className="truncate">
                                                            {x.partner.organizationName ??
                                                                [x.partner.firstName, x.partner.lastName].filter(Boolean).join(" ") ??
                                                                x.partner.code}
                                                        </span>
                                                        {x.isPrimary ? (
                                                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-200">
                                                                PRIMARY
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 truncate">
                                                        {x.partner.email ?? "—"}{" "}
                                                        {x.partner.phone ? `• ${x.partner.phone}` : ""}
                                                    </p>
                                                </div>

                                                {/* RIGHT ACTIONS */}
                                                <div className="flex shrink-0 gap-2">
                                                    <SimpleTooltip text="Eliminar del proyecto">
                                                        <button
                                                            type="button"
                                                            disabled={pending}
                                                            onClick={() => {
                                                                setMsg(null);
                                                                startTransition(async () => {
                                                                    const res = await removeProjectPartnerAction(x.id);
                                                                    if (!res.ok) {
                                                                        setMsg({ type: "error", text: res.message });
                                                                        return;
                                                                    }
                                                                    setMsg({ type: "success", text: "Eliminado." });
                                                                    setTimeout(() => setMsg(null), 1200);
                                                                    router.refresh();
                                                                });
                                                            }}
                                                            className="flex items-center justify-center size-9 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                                                        >
                                                            <GrTrash size={18} />

                                                        </button>
                                                    </SimpleTooltip>

                                                    <SimpleTooltip
                                                        text={
                                                            x.isPrimary
                                                                ? "Principal"
                                                                : "Marcar como principal"
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={pending}
                                                            onClick={() => {
                                                                setMsg(null);
                                                                startTransition(async () => {
                                                                    const res = await setProjectPartnerPrimaryAction(x.id, !x.isPrimary);
                                                                    if (!res.ok) {
                                                                        setMsg({ type: "error", text: res.message });
                                                                        return;
                                                                    }
                                                                    setMsg({ type: "success", text: x.isPrimary ? "Primary removido." : "Primary asignado." });
                                                                    setTimeout(() => setMsg(null), 1200);
                                                                    router.refresh();
                                                                });
                                                            }}
                                                            className={[
                                                                "flex items-center justify-center size-9 rounded-lg border transition cursor-pointer",
                                                                x.isPrimary
                                                                    ? "text-slate-700 dark:text-slate-200 border-slate-400/20 bg-slate-500/10 hover:bg-slate-500/15"
                                                                    : "text-fuchsia-500 dark:text-fuchsia-200 border-fuchsia-500/20 bg-fuchsia-500/10 hover:bg-fuchsia-500/15",
                                                            ].join(" ")}
                                                        >
                                                            {x.isPrimary ? <GrCheckbox size={18} /> : <GrCheckboxSelected size={18} />}
                                                        </button>

                                                    </SimpleTooltip>

                                                </div>

                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}