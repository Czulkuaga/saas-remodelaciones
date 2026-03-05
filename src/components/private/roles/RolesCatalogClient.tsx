"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createTenantRoleAction, deleteTenantRoleAction } from "@/action/roles/role-actions";

type RoleRow = {
    id: string;
    tenantId: string | null;
    name: string;
    key: string;
    isSystem: boolean;
    createdAt: Date;
    _count: { permissions: number; members: number };
};

type Overview = {
  roles: {
    totalVisible: number;
    systemRoles: number;
    tenantRoles: number;
    tenantRolesNoPerms: number;
  };
  permissions: {
    total: number;
    unused: number;
  };
  users: {
    membershipsActive: number;
    withoutRolesNonAdmin: number;
  };
};

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2">
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
    );
}

function Hint({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
            {children}
        </div>
    );
}

export function RolesCatalogClient({ roles, overview }: { roles: RoleRow[];  overview: Overview | null }) {
    const [query, setQuery] = useState("");
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [isPending, startTransition] = useTransition();

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
    }, [roles, query]);

    function create() {
        startTransition(async () => {
            const res = await createTenantRoleAction({ name, key });
            if (!res.ok) return alert(res.message);
            setName("");
            setKey("");
            // SSR revalidatePath hará refresh al navegar o recargar; si quieres auto-refresh, lo hacemos con router.refresh()
            location.reload();
        });
    }

    function del(roleId: string) {
        if (!confirm("¿Eliminar rol del tenant?")) return;
        startTransition(async () => {
            const res = await deleteTenantRoleAction(roleId);
            if (!res.ok) return alert(res.message);
            location.reload();
        });
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">Crear rol del tenant</div>
                        <Link
                            href="/roles/assign"
                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        >
                            Asignación a usuarios →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="rounded-xl border px-3 py-2 text-sm bg-transparent border-slate-200 dark:border-slate-800" />
                        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="key (snake_case)" className="rounded-xl border px-3 py-2 text-sm bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>

                    <button
                        disabled={isPending}
                        onClick={create}
                        className="w-full rounded-xl px-3 py-2 text-sm font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-60 cursor-pointer"
                    >
                        {isPending ? "Guardando…" : "Crear rol"}
                    </button>

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar roles..."
                        className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent border-slate-200 dark:border-slate-800"
                    />
                </div>

                <div className="p-4 space-y-2">
                    {filtered.map((r) => (
                        <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</div>
                                    <div className="text-xs text-slate-500">{r.key}</div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300/40 text-slate-600 dark:text-slate-300">
                                    {r.isSystem ? "SYSTEM" : "TENANT"}
                                </span>
                            </div>

                            <div className="mt-2 flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">Permisos: <b>{r._count.permissions}</b></span>
                                <span className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">Usuarios: <b>{r._count.members}</b></span>
                            </div>

                            <div className="mt-3 flex justify-end gap-2">
                                <Link
                                    href={`/roles/${r.id}`}
                                    className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                                >
                                    Ver detalle
                                </Link>

                                {!r.isSystem ? (
                                    <button
                                        disabled={isPending}
                                        onClick={() => del(r.id)}
                                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                    >
                                        Eliminar
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="xl:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 p-6 h-100">
                <div className="text-slate-900 dark:text-slate-100 font-semibold">Cómo funciona</div>
                {overview ? (
                    <>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label="Roles visibles" value={overview.roles.totalVisible} />
                            <Stat label="Roles System" value={overview.roles.systemRoles} />
                            <Stat label="Roles Tenant" value={overview.roles.tenantRoles} />
                            <Stat label="Tenant sin permisos" value={overview.roles.tenantRolesNoPerms} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Stat label="Permisos catálogo" value={overview.permissions.total} />
                            <Stat label="Permisos sin uso" value={overview.permissions.unused} />
                            <Stat label="Membresías activas" value={overview.users.membershipsActive} />
                            <Stat label="Usuarios sin roles" value={overview.users.withoutRolesNonAdmin} />
                        </div>

                        <div className="mt-4 space-y-2">
                            {overview.users.withoutRolesNonAdmin > 0 ? (
                                <Hint>
                                    Hay <b>{overview.users.withoutRolesNonAdmin}</b> usuarios (no ADMIN) sin roles asignados. Recomendado: asignar roles.
                                    <div className="mt-2">
                                        <a href="/roles/assign" className="underline font-semibold">Ir a Asignación a usuarios</a>
                                    </div>
                                </Hint>
                            ) : (
                                <Hint>✔ Todos los usuarios (no ADMIN) tienen al menos un rol asignado.</Hint>
                            )}

                            {overview.roles.tenantRolesNoPerms > 0 ? (
                                <Hint>
                                    Hay <b>{overview.roles.tenantRolesNoPerms}</b> roles TENANT sin permisos. Recomendado: configurar permisos en el detalle del rol.
                                </Hint>
                            ) : (
                                <Hint>✔ Todos los roles TENANT tienen permisos asignados.</Hint>
                            )}

                            {overview.permissions.unused > 0 ? (
                                <Hint>
                                    Hay <b>{overview.permissions.unused}</b> permisos del catálogo sin asignación a ningún rol (puede ser normal si aún no usas módulos).
                                </Hint>
                            ) : (
                                <Hint>✔ Todos los permisos del catálogo están siendo usados por al menos un rol.</Hint>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        No se pudo cargar el resumen RBAC.
                    </div>
                )}
            </div>
        </div>
    );
}