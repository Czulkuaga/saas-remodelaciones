"use client";

import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import { z } from "zod";
import { tenantSchema, type TenantInput } from "@/lib/zod/tenant";
import { slugifyTenant } from "@/lib/slug";
import { useSearchParams } from "next/navigation";
import { IoClose } from "react-icons/io5";

type FieldErrors = Partial<Record<keyof TenantInput, string>>;

function zodFieldErrors(err: z.ZodError): FieldErrors {
    const out: FieldErrors = {};
    for (const issue of err.issues) {
        const key = issue.path?.[0] as keyof TenantInput | undefined;
        if (!key) continue;
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

type TenantOption = { slug: string; name: string; status: "ACTIVE" | "SUSPENDED" | "DELETED" };

type ResolveResponse =
    | { ok: true; slug: string; name?: string }
    | { ok: true; options: TenantOption[] }
    | { ok: false; message: string; code?: string };

function sanitizeNext(next: string | null): string | null {
    if (!next) return null;
    const v = next.trim();
    if (!v) return null;
    if (!v.startsWith("/")) return null;
    if (v.startsWith("//")) return null;
    return v;
}

function StatusBadge({ status }: { status: "ACTIVE" | "SUSPENDED" | "DELETED" }) {
    const base =
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black tracking-wide";

    if (status === "ACTIVE") {
        return (
            <span
                className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`}
            >
                ACTIVA
            </span>
        );
    }

    if (status === "SUSPENDED") {
        return (
            <span
                className={`${base} border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300`}
            >
                SUSPENDIDA
            </span>
        );
    }

    return (
        <span className={`${base} border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300`}>
            ELIMINADA
        </span>
    );
}

function TenantPickerModal(props: {
    open: boolean;
    options: TenantOption[];
    domain: string;
    onClose: () => void;
    onSelect: (slug: string) => void;
}) {
    const { open, options, domain, onClose, onSelect } = props;

    const [q, setQ] = useState("");

    useEffect(() => {
        if (!open) return;
        setQ("");
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const list = !needle
            ? options
            : options.filter(
                (o) => o.name.toLowerCase().includes(needle) || o.slug.toLowerCase().includes(needle)
            );

        // ACTIVE primero
        return [...list].sort((a, b) => (a.status === b.status ? 0 : a.status === "ACTIVE" ? -1 : 1));
    }, [q, options]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Seleccionar organización"
        >
            {/* overlay */}
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Cerrar"
            />

            {/* modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                Selecciona tu organización
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Encontramos varias coincidencias. Elige la correcta para continuar.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                        >
                            <IoClose size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* search */}
                    <div className="mt-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className={[
                                    "w-full rounded-xl border bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 outline-none",
                                    "border-slate-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300",
                                    "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-400/30 dark:focus:border-indigo-500/40",
                                ].join(" ")}
                                placeholder="Buscar por nombre o slug…"
                            />
                        </div>
                    </div>
                </div>

                <ul className="max-h-96 overflow-auto p-3">
                    {filtered.map((o) => {
                        const disabled = o.status !== "ACTIVE";

                        return (
                            <li key={o.slug}>
                                <button
                                    type="button"
                                    onClick={() => !disabled && onSelect(o.slug)}
                                    disabled={disabled}
                                    className={[
                                        "w-full rounded-xl border px-4 py-3 text-left transition",
                                        "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300",
                                        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
                                        disabled
                                            ? "opacity-60 cursor-not-allowed hover:bg-white hover:border-slate-200 dark:hover:bg-slate-950 dark:hover:border-slate-800"
                                            : "",
                                    ].join(" ")}
                                    aria-disabled={disabled}
                                    title={
                                        disabled
                                            ? o.status === "SUSPENDED"
                                                ? "Esta organización está suspendida. Contacta soporte."
                                                : "Esta organización fue eliminada y no está disponible."
                                            : "Continuar"
                                    }
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {o.name}
                                                </div>
                                                <StatusBadge status={o.status} />
                                            </div>

                                            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {o.slug}.{domain}
                                                {disabled && (
                                                    <span className="ml-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                        {o.status === "SUSPENDED" ? "Contacta soporte" : "No disponible"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <FaArrowRight
                                            size={16}
                                            className={disabled ? "text-slate-300 dark:text-slate-700" : "text-slate-400"}
                                        />
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tip: también puedes escribir directamente el slug.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export const FormTenant = () => {
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "medicloud.com";

    const sp = useSearchParams();
    const nextPath = useMemo(() => sanitizeNext(sp.get("next")), [sp]);

    const [values, setValues] = useState<TenantInput>({ workspace: "" });
    const [touched, setTouched] = useState<Partial<Record<keyof TenantInput, boolean>>>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const [isResolving, setIsResolving] = useState(false);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerOptions, setPickerOptions] = useState<TenantOption[]>([]);

    const previewSlug = useMemo(() => slugifyTenant(values.workspace), [values.workspace]);
    const workspaceError = touched.workspace ? errors.workspace : undefined;

    function validateAll(next: TenantInput) {
        const parsed = tenantSchema.safeParse(next);
        if (parsed.success) {
            setErrors({});
            return { ok: true as const, data: parsed.data };
        }
        setErrors(zodFieldErrors(parsed.error));
        return { ok: false as const };
    }

    function validateField(next: TenantInput) {
        const parsed = tenantSchema.safeParse(next);
        if (parsed.success) {
            setErrors((p) => ({ ...p, workspace: undefined }));
            return;
        }
        const fe = zodFieldErrors(parsed.error);
        setErrors((p) => ({ ...p, workspace: fe.workspace }));
    }

    function goToTenant(slug: string) {
        const isLocal = ROOT_DOMAIN.includes("localhost");
        const protocol = isLocal ? "http" : "https";

        const base = `${protocol}://${slug}.${ROOT_DOMAIN}/login`;
        const url = nextPath ? `${base}?next=${encodeURIComponent(nextPath)}` : base;

        window.location.assign(url);
    }

    const canSubmit =
        !isResolving && values.workspace.trim().length > 0 && !errors.workspace && previewSlug.length >= 2;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setTouched({ workspace: true });

        const res = validateAll(values);
        if (!res.ok) return;

        const slugGuess = slugifyTenant(res.data.workspace);
        if (slugGuess.length < 2) {
            setErrors((p) => ({ ...p, workspace: "Por favor ingresa una organización válida." }));
            return;
        }

        try {
            setIsResolving(true);

            const r = await fetch("/api/tenant/resolve", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    query: res.data.workspace,
                    slugGuess,
                }),
            });

            const data = (await r.json()) as ResolveResponse;

            if (!r.ok || !data.ok) {
                if (!data.ok && data.code === "TENANT_SUSPENDED") {
                    setFormError("Esta organización está suspendida. Contacta al soporte.");
                    return;
                }
                if (!data.ok && data.code === "TENANT_DELETED") {
                    setFormError("Esta organización fue eliminada y ya no está disponible.");
                    return;
                }
                setFormError(!data.ok ? data.message : "No fue posible resolver la organización.");
                return;
            }

            if ("options" in data) {
                setPickerOptions(data.options);
                setPickerOpen(true);
                return;
            }

            goToTenant(data.slug);
        } catch {
            setFormError("Error de red. Intenta nuevamente.");
        } finally {
            setIsResolving(false);
        }
    }

    return (
        <>
            <TenantPickerModal
                open={pickerOpen}
                options={pickerOptions}
                domain={ROOT_DOMAIN}
                onClose={() => setPickerOpen(false)}
                onSelect={(slug) => goToTenant(slug)}
            />

            <form className="space-y-6" onSubmit={onSubmit} noValidate>
                {formError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                        {formError}
                    </div>
                )}

                <div className="space-y-2">
                    <label
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                        htmlFor="workspace-url"
                    >
                        Nombre o dominio de tu organización
                    </label>

                    <div className="relative">
                        <div className="flex items-stretch">
                            <input
                                className={[
                                    "flex-1 block w-full rounded-xl rounded-r-none border bg-white px-4 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                    "dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500",
                                    "focus:ring-2 focus:border-transparent",
                                    workspaceError
                                        ? "border-rose-300 focus:ring-rose-400/40 dark:border-rose-900/60"
                                        : "border-slate-200 focus:ring-indigo-500/35 dark:border-slate-800 dark:focus:ring-indigo-400/25",
                                ].join(" ")}
                                id="workspace-url"
                                name="workspace-url"
                                placeholder="Ej: MiEmpresa o mi-empresa"
                                type="text"
                                value={values.workspace}
                                disabled={isResolving}
                                onChange={(e) => {
                                    setFormError(null);
                                    const next = { workspace: e.target.value };
                                    setValues(next);
                                    if (touched.workspace) validateField(next);
                                }}
                                onBlur={() => {
                                    setTouched((p) => ({ ...p, workspace: true }));
                                    validateField(values);
                                }}
                                aria-invalid={!!workspaceError}
                                aria-describedby={workspaceError ? "workspace-error" : "workspace-help"}
                            />

                            <div className="select-none rounded-xl rounded-l-none border border-l-0 border-slate-200 bg-slate-50 px-4 py-4 font-mono text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                                .{ROOT_DOMAIN}
                            </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Vista previa:{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {previewSlug || "—"}
                            </span>
                            .{ROOT_DOMAIN}
                        </div>

                        {nextPath && (
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Continuar a:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{nextPath}</span>
                            </div>
                        )}

                        <div className="mt-2 min-h-5">
                            {workspaceError ? (
                                <p id="workspace-error" className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                                    {workspaceError}
                                </p>
                            ) : (
                                <p
                                    id="workspace-help"
                                    className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2"
                                >
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                                    Escribe el nombre o el slug; si hay varias coincidencias, te mostraremos opciones.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className={[
                        "w-full rounded-xl px-5 py-4 font-black shadow-lg transition-all flex items-center justify-center gap-2 group",
                        "text-white bg-linear-to-r from-indigo-600 to-fuchsia-600",
                        "hover:from-indigo-600/95 hover:to-fuchsia-600/95",
                        "shadow-indigo-500/20 dark:shadow-indigo-500/10",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                    ].join(" ")}
                    type="submit"
                    disabled={!canSubmit}
                >
                    <span className="inline-flex items-center gap-2">
                        {isResolving && (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        )}
                        {isResolving ? "Verificando organización…" : "Continuar"}
                    </span>
                    <FaArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
            </form>
        </>
    );
};