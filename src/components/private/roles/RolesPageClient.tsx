"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteRoleAction, setRolePermissionsAction, upsertRoleAction } from "@/action/roles/role-actions";
import { setMembershipRolesAction } from "@/action/roles/membership-role-actions";

type RoleRow = { id: string; name: string; key: string; isSystem: boolean; createdAt: Date };
type PermRow = { id: string; key: string; description: string | null };
type MembershipRow = {
    id: string;
    category: string;
    isActive: boolean;
    user: { id: string; name: string | null; email: string };
    roles: { roleId: string }[];
};

export function RolesPageClient({
    roles,
    permissions,
    memberships,
}: {
    roles: RoleRow[];
    permissions: PermRow[];
    memberships: MembershipRow[];
}) {
    const [isPending, startTransition] = useTransition();

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id ?? null);
    const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

    const [roleForm, setRoleForm] = useState({ name: "", key: "" });

    // local state maps
    const [rolePerms, setRolePerms] = useState<Record<string, Set<string>>>(() => ({}));
    const [membershipRoles, setMembershipRoles] = useState<Record<string, Set<string>>>(() => {
        const map: Record<string, Set<string>> = {};
        for (const m of memberships) map[m.id] = new Set(m.roles.map((x) => x.roleId));
        return map;
    });

    // permission selection for selected role
    const selectedPermSet = useMemo(() => {
        if (!selectedRoleId) return new Set<string>();
        return rolePerms[selectedRoleId] ?? new Set<string>();
    }, [rolePerms, selectedRoleId]);

    function togglePerm(pid: string) {
        if (!selectedRoleId) return;
        setRolePerms((prev) => {
            const next = { ...prev };
            const set = new Set(next[selectedRoleId] ?? []);
            set.has(pid) ? set.delete(pid) : set.add(pid);
            next[selectedRoleId] = set;
            return next;
        });
    }

    function saveRolePermissions() {
        if (!selectedRoleId) return;
        const ids = [...(rolePerms[selectedRoleId] ?? new Set())];
        startTransition(async () => {
            const res = await setRolePermissionsAction({ roleId: selectedRoleId, permissionIds: ids });
            if (!res.ok) alert(res.message);
        });
    }

    function saveMembershipRoles(membershipId: string) {
        const ids = [...(membershipRoles[membershipId] ?? new Set())];
        startTransition(async () => {
            const res = await setMembershipRolesAction({ membershipId, roleIds: ids });
            if (!res.ok) alert(res.message);
        });
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Roles */}
            <div className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Roles</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Crea y selecciona un rol para editar permisos.</div>
                </div>

                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={roleForm.name}
                            onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Nombre (ej. Colaborador)"
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm"
                        />
                        <input
                            value={roleForm.key}
                            onChange={(e) => setRoleForm((p) => ({ ...p, key: e.target.value }))}
                            placeholder="key (ej. collaborator)"
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm"
                        />
                    </div>

                    <button
                        disabled={isPending}
                        onClick={() =>
                            startTransition(async () => {
                                const res = await upsertRoleAction(roleForm);
                                if (!res.ok) return alert(res.message);
                                // refrescar vía revalidatePath; en UI simple, el SSR recargará al navegar.
                                setRoleForm({ name: "", key: "" });
                            })
                        }
                        className="w-full rounded-xl px-3 py-2 text-sm font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-60"
                    >
                        {isPending ? "Guardando…" : "Crear rol"}
                    </button>

                    <div className="space-y-2">
                        {roles.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRoleId(r.id)}
                                className={[
                                    "w-full text-left rounded-xl p-3 border transition",
                                    r.id === selectedRoleId
                                        ? "border-fuchsia-500/40 bg-fuchsia-500/10"
                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</div>
                                    {r.isSystem ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300/40 text-slate-600 dark:text-slate-300">
                                            SYSTEM
                                        </span>
                                    ) : null}
                                </div>
                                <div className="text-xs text-slate-500">{r.key}</div>

                                {!r.isSystem ? (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!confirm("¿Eliminar rol?")) return;
                                                startTransition(async () => {
                                                    const res = await deleteRoleAction(r.id);
                                                    if (!res.ok) alert(res.message);
                                                });
                                            }}
                                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Permisos del rol */}
            <div className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Permisos</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Rol seleccionado: <span className="font-semibold">{selectedRole?.name ?? "—"}</span>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <button
                        disabled={!selectedRoleId || isPending}
                        onClick={saveRolePermissions}
                        className="w-full rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 disabled:opacity-60"
                    >
                        Guardar permisos del rol
                    </button>

                    <div className="max-h-130 overflow-auto space-y-2 pr-1">
                        {permissions.map((p) => {
                            const checked = selectedPermSet.has(p.id);
                            return (
                                <label
                                    key={p.id}
                                    className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 p-3 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1 size-4"
                                        checked={checked}
                                        onChange={() => togglePerm(p.id)}
                                        disabled={!selectedRoleId}
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.key}</div>
                                        {p.description ? <div className="text-xs text-slate-500">{p.description}</div> : null}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Asignación a usuarios */}
            <div className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Usuarios</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Asigna múltiples roles por usuario (membership).</div>
                </div>

                <div className="p-4 space-y-3 max-h-165 overflow-auto pr-1">
                    {memberships.map((m) => {
                        const set = membershipRoles[m.id] ?? new Set<string>();
                        return (
                            <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                            {m.user.name ?? "—"} <span className="text-xs text-slate-500">({m.user.email})</span>
                                        </div>
                                        <div className="text-xs text-slate-500">Category: {m.category} • Membership: {m.isActive ? "Activa" : "Inactiva"}</div>
                                    </div>

                                    <button
                                        disabled={isPending}
                                        onClick={() => saveMembershipRoles(m.id)}
                                        className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-60"
                                    >
                                        Guardar
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {roles.map((r) => {
                                        const checked = set.has(r.id);
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() =>
                                                    setMembershipRoles((prev) => {
                                                        const next = { ...prev };
                                                        const s = new Set(next[m.id] ?? []);
                                                        checked ? s.delete(r.id) : s.add(r.id);
                                                        next[m.id] = s;
                                                        return next;
                                                    })
                                                }
                                                className={[
                                                    "text-xs px-2 py-1 rounded-full border transition",
                                                    checked
                                                        ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200"
                                                        : "border-slate-300/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/30",
                                                ].join(" ")}
                                            >
                                                {r.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}