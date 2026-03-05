// src/app/(private)/users/UsersTable.client.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import type { TenantUserRow } from "@/action/users/user-actions";
import { updateMembershipAction } from "@/action/users/user-actions";
import { UserMembershipModal } from "@/components/private/users/UserMembershipModal";
import { MembershipCategory } from "../../../../generated/prisma/enums";
import { FaEdit } from "react-icons/fa";
import { GrCheckbox, GrCheckboxSelected } from "react-icons/gr";

type MembershipStatusFilter = "all" | "active" | "inactive";
type SortKey = "createdAtDesc" | "nameAsc" | "emailAsc";

function onlyDigits(v: string) {
    return v.replace(/\D/g, "");
}

function formatPhoneDisplay(row: TenantUserRow) {
    const phone = (row.user as any).phone as string | null | undefined;
    const phoneNorm = (row.user as any).phoneNormalized as string | null | undefined;
    if (phoneNorm) return phoneNorm; // +57...
    if (phone) return phone;
    return "—";
}

export function UsersTable({ initialRows }: { initialRows: TenantUserRow[] }) {
    const [rows, setRows] = useState<TenantUserRow[]>(initialRows);

    // UI state
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<MembershipCategory | "all">("all");
    const [statusFilter, setStatusFilter] = useState<MembershipStatusFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("createdAtDesc");

    // paging (client-side)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // modal
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<TenantUserRow | null>(null);

    const [isPending, startTransition] = useTransition();

    const processed = useMemo(() => {
        const q = query.trim().toLowerCase();
        const qDigits = onlyDigits(query);

        let list = [...rows];

        // filtros
        if (categoryFilter !== "all") {
            list = list.filter((r) => r.category === categoryFilter);
        }

        if (statusFilter !== "all") {
            list = list.filter((r) => (statusFilter === "active" ? r.isActive : !r.isActive));
        }

        // búsqueda (nombre/email/teléfono)
        if (q) {
            list = list.filter((r) => {
                const name = (r.user.name ?? "").toLowerCase();
                const email = r.user.email.toLowerCase();

                const phone = ((r.user as any).phone ?? "") as string;
                const phoneNorm = ((r.user as any).phoneNormalized ?? "") as string;

                const phoneDigits = onlyDigits(phone);
                const phoneNormDigits = onlyDigits(phoneNorm);

                const matchesText = name.includes(q) || email.includes(q) || phone.toLowerCase().includes(q) || phoneNorm.toLowerCase().includes(q);
                const matchesDigits = qDigits ? phoneDigits.includes(qDigits) || phoneNormDigits.includes(qDigits) : false;

                return matchesText || matchesDigits;
            });
        }

        // orden
        switch (sortKey) {
            case "nameAsc":
                list.sort((a, b) => (a.user.name ?? "").localeCompare(b.user.name ?? ""));
                break;
            case "emailAsc":
                list.sort((a, b) => a.user.email.localeCompare(b.user.email));
                break;
            case "createdAtDesc":
            default:
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }

        return list;
    }, [rows, query, categoryFilter, statusFilter, sortKey]);

    // paginación
    const total = processed.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageRows = processed.slice(start, start + pageSize);

    // si cambian filtros/busqueda/tamaño, reset a page 1
    function resetPaging() {
        setPage(1);
    }

    function upsertLocal(updated: TenantUserRow) {
        setRows((prev) => {
            const idx = prev.findIndex((x) => x.id === updated.id);
            if (idx === -1) return [updated, ...prev];
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
        });
    }

    function toggleMembershipActive(row: TenantUserRow) {
        const next = !row.isActive;

        const label = next ? "¿Habilitar este usuario en el tenant?" : "¿Deshabilitar este usuario en el tenant?";
        if (!confirm(label)) return;

        startTransition(async () => {
            const res = await updateMembershipAction({
                membershipId: row.id,
                category: row.category, // conservar
                isActive: next,
            });

            if (!res.ok) return alert(res.message);

            upsertLocal(res.row);
        });
    }

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 shadow-sm">
            {/* Header */}
            <div className="p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            resetPaging();
                        }}
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="w-full md:w-105 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                    />

                    <div className="flex items-center gap-2">
                        {isPending ? <span className="text-xs text-slate-500">Procesando…</span> : null}
                        <button
                            onClick={() => {
                                setEditing(null);
                                setOpen(true);
                            }}
                            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                        >
                            + Agregar usuario
                        </button>
                    </div>
                </div>

                {/* Filters row */}
                <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value as any);
                                resetPaging();
                            }}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none"
                        >
                            <option value="all">Todas las categorías</option>
                            {Object.values(MembershipCategory).map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as MembershipStatusFilter);
                                resetPaging();
                            }}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none"
                        >
                            <option value="all">Todas (Activa/Inactiva)</option>
                            <option value="active">Solo activas</option>
                            <option value="inactive">Solo inactivas</option>
                        </select>

                        <select
                            value={sortKey}
                            onChange={(e) => {
                                setSortKey(e.target.value as SortKey);
                                resetPaging();
                            }}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none"
                        >
                            <option value="createdAtDesc">Más recientes</option>
                            <option value="nameAsc">Nombre (A-Z)</option>
                            <option value="emailAsc">Email (A-Z)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {total} resultado{total === 1 ? "" : "s"}
                        </span>

                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                resetPaging();
                            }}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none"
                        >
                            {[10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}/página
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-275 w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
                        <tr className="text-left text-slate-600 dark:text-slate-300">
                            <th className="p-3">Usuario</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Teléfono</th>
                            <th className="p-3">Categoría</th>
                            <th className="p-3">Membresía</th>
                            <th className="p-3 text-right">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {pageRows.map((r) => (
                            <tr key={r.id} className="text-slate-800 dark:text-slate-100">
                                <td className="p-3">
                                    <div className="font-semibold">{r.user.name ?? "—"}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Usuario global: {r.user.isActive ? "Activo" : "Inactivo"}
                                    </div>
                                </td>

                                <td className="p-3">{r.user.email}</td>

                                <td className="p-3">
                                    <span className="font-mono text-xs">{formatPhoneDisplay(r)}</span>
                                </td>

                                <td className="p-3">
                                    <span className="text-xs px-2 py-1 rounded-full border border-slate-300/40 dark:border-slate-700/60">
                                        {r.category}
                                    </span>
                                </td>

                                <td className="p-3">
                                    <span
                                        className={[
                                            "text-xs px-2 py-1 rounded-full border",
                                            r.isActive
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-200"
                                                : "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300",
                                        ].join(" ")}
                                    >
                                        {r.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </td>

                                <td className="p-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            disabled={isPending}
                                            onClick={() => {
                                                setEditing(r);
                                                setOpen(true);
                                            }}
                                            className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
                                            title="Editar usuario"
                                        >
                                            <FaEdit size={18}/>
                                        </button>

                                        {/* ✅ “Remover” => solo deshabilitar/habilitar membership */}
                                        <button
                                            disabled={isPending}
                                            onClick={() => toggleMembershipActive(r)}
                                            className={[
                                                "rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer",
                                                r.isActive
                                                    ? "border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                                                    : "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200",
                                            ].join(" ")}
                                            title={r.isActive ? "Deshabilitar" : "Habilitar"}
                                        >
                                            {r.isActive ? <GrCheckbox size={18} /> : <GrCheckboxSelected size={18} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {pageRows.length === 0 ? (
                            <tr>
                                <td className="p-6 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                                    No hay usuarios que coincidan con tu búsqueda.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando <span className="font-semibold">{total === 0 ? 0 : start + 1}</span>–
                    <span className="font-semibold">{Math.min(start + pageSize, total)}</span> de{" "}
                    <span className="font-semibold">{total}</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => setPage(1)}
                        disabled={safePage === 1}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                    >
                        « Primero
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                    >
                        ‹ Anterior
                    </button>

                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        Página <span className="font-semibold">{safePage}</span> / <span className="font-semibold">{totalPages}</span>
                    </span>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                    >
                        Siguiente ›
                    </button>
                    <button
                        onClick={() => setPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                    >
                        Último »
                    </button>
                </div>
            </div>

            {/* Modal */}
            <UserMembershipModal
                open={open}
                initial={editing}
                onClose={() => setOpen(false)}
                onSaved={(row) => {
                    upsertLocal(row);
                    setOpen(false);
                }}
                onCreated={(row) => {
                    setRows((prev) => [row, ...prev]);
                    setOpen(false);
                }}
            />
        </div>
    );
}