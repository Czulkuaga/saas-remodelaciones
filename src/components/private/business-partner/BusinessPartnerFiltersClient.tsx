"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
    initial: { q: string; type: string; status: string; pageSize: number };
};

type BPType = "ALL" | "PERSON" | "ORGANIZATION";
type BPStatus = "ALL" | "ACTIVE" | "INACTIVE";

function normalizeType(v: string | null | undefined): BPType {
    if (v === "PERSON" || v === "ORGANIZATION") return v;
    return "ALL";
}

function normalizeStatus(v: string | null | undefined): BPStatus {
    if (v === "ACTIVE" || v === "INACTIVE") return v;
    return "ALL";
}

function normalizePageSize(v: string | number | null | undefined): string {
    const n = typeof v === "number" ? v : Number(v ?? 20);
    if (n === 10 || n === 20 || n === 50) return String(n);
    return "20";
}

export default function BusinessPartnerFiltersClient({ initial }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();

    // ✅ hidrata desde SSR initial (estable)
    const [q, setQ] = useState(initial.q ?? "");
    const [type, setType] = useState<BPType>(normalizeType(initial.type));
    const [status, setStatus] = useState<BPStatus>(normalizeStatus(initial.status));
    const [pageSize, setPageSize] = useState<string>(normalizePageSize(initial.pageSize));

    // si la URL cambia por navegación externa (back/forward, paginación, etc.)
    // sincroniza el estado solo cuando realmente cambie el valor
    const baseQS = searchParams.toString();
    useEffect(() => {
        const sp = new URLSearchParams(baseQS);

        const nextQ = sp.get("q") ?? "";
        const nextType = normalizeType(sp.get("type"));
        const nextStatus = normalizeStatus(sp.get("status"));
        const nextPageSize = normalizePageSize(sp.get("pageSize"));

        // evita setState innecesarios (y renders extra)
        setQ((prev) => (prev === nextQ ? prev : nextQ));
        setType((prev) => (prev === nextType ? prev : nextType));
        setStatus((prev) => (prev === nextStatus ? prev : nextStatus));
        setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
    }, [baseQS]);

    // ✅ ref anti-re-aplicar la misma URL
    const lastAppliedRef = useRef<string>("");

    function buildNextQS(opts: {
        q: string;
        type: BPType;
        status: BPStatus;
        pageSize: string;
    }) {
        const p = new URLSearchParams(searchParams.toString());

        const qTrim = opts.q.trim();
        if (qTrim) p.set("q", qTrim);
        else p.delete("q");

        if (opts.type !== "ALL") p.set("type", opts.type);
        else p.delete("type");

        if (opts.status !== "ALL") p.set("status", opts.status);
        else p.delete("status");

        p.set("pageSize", opts.pageSize || "20");
        p.set("page", "1"); // al cambiar filtros, reset página

        return p.toString();
    }

    function applyNow(nextQS: string) {
        // no navegar si no cambia nada o si ya lo aplicamos
        if (nextQS === baseQS) return;
        if (lastAppliedRef.current === nextQS) return;

        lastAppliedRef.current = nextQS;
        startTransition(() => {
            router.replace(`${pathname}?${nextQS}`, { scroll: false });
        });
    }

    // ✅ Debounce SOLO para q (typing)
    useEffect(() => {
        const t = setTimeout(() => {
            const nextQS = buildNextQS({ q, type, status, pageSize });
            applyNow(nextQS);
        }, 350);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]); // 👈 SOLO q

    // ✅ Cambios de selects -> inmediato (sin debounce)
    useEffect(() => {
        const nextQS = buildNextQS({ q, type, status, pageSize });
        applyNow(nextQS);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, status, pageSize]); // 👈 inmediato

    return (
        <div className="rounded-2xl border border-fuchsia-500/20 bg-slate-900/40 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-6">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Buscar
                    </label>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Código, nombre, email, teléfono..."
                        className="mt-2 w-full bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                    />
                </div>

                <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Tipo
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(normalizeType(e.target.value))}
                        className="mt-2 w-full bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                    >
                        <option value="ALL">Todos</option>
                        <option value="ORGANIZATION">Organización</option>
                        <option value="PERSON">Persona</option>
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Estado
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(normalizeStatus(e.target.value))}
                        className="mt-2 w-full bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                    >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Página
                    </label>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(normalizePageSize(e.target.value))}
                        className="mt-2 w-full bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>

            {pending && <div className="mt-3 text-xs text-slate-400">Actualizando…</div>}
        </div>
    );
}