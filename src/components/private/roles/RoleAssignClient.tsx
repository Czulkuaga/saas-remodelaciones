"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setMembershipRolesAction } from "@/action/roles/membership-role-actions";

type RoleRow = { id: string; name: string; key: string; isSystem: boolean };
type MembershipRow = {
    id: string;
    category: string;
    isActive: boolean;
    user: { id: string; name: string | null; email: string; phoneNormalized: string | null };
    roles: { roleId: string; role: { name: string; key: string; isSystem: boolean } }[];
};

export function RoleAssignClient({ roles, memberships }: { roles: RoleRow[]; memberships: MembershipRow[] }) {
    const [q, setQ] = useState("");
    const [isPending, startTransition] = useTransition();

    const [local, setLocal] = useState<Record<string, Set<string>>>(() => {
        const map: Record<string, Set<string>> = {};
        for (const m of memberships) map[m.id] = new Set(m.roles.map((r) => r.roleId));
        return map;
    });

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return memberships;
        return memberships.filter((m) => {
            const name = (m.user.name ?? "").toLowerCase();
            const email = m.user.email.toLowerCase();
            const phone = (m.user.phoneNormalized ?? "").toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [memberships, q]);

    function toggle(membershipId: string, roleId: string) {
        setLocal((prev) => {
            const next = { ...prev };
            const set = new Set(next[membershipId] ?? []);
            set.has(roleId) ? set.delete(roleId) : set.add(roleId);
            next[membershipId] = set;
            return next;
        });
    }

    function save(membershipId: string) {
        const roleIds = [...(local[membershipId] ?? new Set())];
        startTransition(async () => {
            const res = await setMembershipRolesAction({ membershipId, roleIds });
            if (!res.ok) return alert(res.message);
        });
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Asignación de roles</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Gestiona roles por usuario (membresía) en este tenant.</p>
                </div>
                <Link href="/roles" className="rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    ← Volver a Roles
                </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full md:w-96 rounded-xl border px-3 py-2 text-sm bg-transparent border-slate-200 dark:border-slate-800"
                />
                {isPending ? <span className="text-xs text-slate-500">Guardando…</span> : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filtered.map((m) => {
                    const selected = local[m.id] ?? new Set<string>();
                    return (
                        <div key={m.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{m.user.name ?? "—"}</div>
                                    <div className="text-xs text-slate-500">{m.user.email}</div>
                                    {m.user.phoneNormalized ? <div className="text-xs text-slate-500">{m.user.phoneNormalized}</div> : null}
                                    <div className="text-xs text-slate-500 mt-1">
                                        Category: {m.category} • Membership: {m.isActive ? "Activa" : "Inactiva"}
                                    </div>
                                </div>

                                <button
                                    disabled={isPending}
                                    onClick={() => save(m.id)}
                                    className="rounded-xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
                                >
                                    Guardar
                                </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {roles.map((r) => {
                                    const on = selected.has(r.id);
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => toggle(m.id, r.id)}
                                            className={[
                                                "text-xs px-2 py-1 rounded-full border transition",
                                                on
                                                    ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200"
                                                    : "border-slate-300/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/30",
                                            ].join(" ")}
                                        >
                                            {r.name}
                                            {r.isSystem ? <span className="ml-1 opacity-70">(S)</span> : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}