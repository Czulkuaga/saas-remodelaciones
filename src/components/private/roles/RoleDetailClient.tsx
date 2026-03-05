"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setRolePermissionsAction } from "@/action/roles/role-actions";
import { useRouter } from "next/navigation";

type Role = {
    id: string;
    name: string;
    key: string;
    isSystem: boolean;
    tenantId: string | null;
    _count: { members: number };
};

type Perm = { id: string; key: string; description: string | null };

function groupKey(k: string) {
    const [a, b] = k.split(".", 2);
    return b ? a : "general";
}

export function RoleDetailClient({
    role,
    permissions,
    initialPermissionIds,
}: {
    role: Role;
    permissions: Perm[];
    initialPermissionIds: string[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string>>(() => new Set(initialPermissionIds));

    const readOnly = role.isSystem; // ✅ tenant no puede editar system

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = !q ? permissions : permissions.filter((p) => p.key.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));

        // agrupar por módulo (SAP-like)
        const groups = new Map<string, Perm[]>();
        for (const p of list) {
            const g = groupKey(p.key);
            groups.set(g, [...(groups.get(g) ?? []), p]);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [permissions, query]);

    function toggle(id: string) {
        if (readOnly) return;
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function save() {
        startTransition(async () => {
            const res = await setRolePermissionsAction({ roleId: role.id, permissionIds: [...selected] });
            if (!res.ok) return alert(res.message);
            router.refresh();
        });
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{role.name}</h1>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300/40 text-slate-600 dark:text-slate-300">
                            {role.isSystem ? "SYSTEM" : "TENANT"}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{role.key} • Usuarios asignados: {role._count.members}</div>

                    {readOnly ? (
                        <div className="mt-2 text-xs rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200 px-3 py-2">
                            Este es un rol del sistema. En tenant es <b>solo lectura</b>.
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/roles" className="rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        ← Volver
                    </Link>
                    <button
                        disabled={readOnly || isPending}
                        onClick={save}
                        className="rounded-xl px-3 py-2 text-sm font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-60"
                    >
                        {isPending ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Permisos asignados: {selected.size}
                    </div>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar permisos..."
                        className="w-full md:w-96 rounded-xl border px-3 py-2 text-sm bg-transparent border-slate-200 dark:border-slate-800"
                    />
                </div>

                <div className="mt-4 space-y-4">
                    {filtered.map(([group, items]) => (
                        <div key={group} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">
                                {group}
                            </div>
                            <div className="p-3 space-y-2">
                                {items.map((p) => (
                                    <label key={p.id} className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 p-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1 size-4"
                                            checked={selected.has(p.id)}
                                            onChange={() => toggle(p.id)}
                                            disabled={readOnly}
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.key}</div>
                                            {p.description ? <div className="text-xs text-slate-500">{p.description}</div> : null}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}