"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBusinessPartnerAction } from "@/action/business-partner/business-partner";
import { PartnerType, BPRoleType } from "../../../../generated/prisma/enums";

type Msg = { type: "success" | "error"; text: string } | null;

const ROLE_OPTIONS: { value: BPRoleType; label: string; helper?: string }[] = [
    { value: BPRoleType.CLIENT, label: "Cliente" },
    { value: BPRoleType.CONTRACTOR, label: "Contratista" },
    { value: BPRoleType.SUPPLIER, label: "Proveedor" },
    { value: BPRoleType.ARCHITECT, label: "Arquitecto" },
    { value: BPRoleType.ENGINEER, label: "Ingeniero" },
    { value: BPRoleType.STAFF, label: "Staff" },
    { value: BPRoleType.CONTACT, label: "Contacto" },
];

function defaultRolesForType(t: PartnerType): BPRoleType[] {
    if (t === "ORGANIZATION") return [BPRoleType.SUPPLIER, BPRoleType.CONTRACTOR];
    return [BPRoleType.CONTACT];
}

export function BusinessPartnerCreateFormClient() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<Msg>(null);

    const [type, setType] = useState<PartnerType>("ORGANIZATION");
    const [roles, setRoles] = useState<BPRoleType[]>(() => defaultRolesForType("ORGANIZATION"));

    const showOrg = type === "ORGANIZATION";
    const showPerson = type === "PERSON";
    const title = useMemo(() => (showOrg ? "Organización" : "Persona"), [showOrg]);

    // ✅ SAP-ish: cuando cambias tipo, no te quedes sin roles
    useEffect(() => {
        setRoles((prev) => {
            if (prev.length > 0) return prev;
            return defaultRolesForType(type);
        });
    }, [type]);

    function toggleRole(r: BPRoleType) {
        setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
    }

    async function onSubmit(formData: FormData) {
        setMsg(null);

        const input = {
            type,
            roles, // ✅ aquí va lo nuevo
            organizationName: String(formData.get("organizationName") ?? ""),
            firstName: String(formData.get("firstName") ?? ""),
            lastName: String(formData.get("lastName") ?? ""),
            email: String(formData.get("email") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            isActive: formData.get("isActive") === "on",
        };

        startTransition(async () => {
            const res = await createBusinessPartnerAction(input as any);
            if (!res.ok) {
                setMsg({ type: "error", text: res.message });
                return;
            }
            router.push(`/business-partner/${res.id}`);
        });
    }

    const rolesLabel = useMemo(() => {
        const map = new Map(ROLE_OPTIONS.map((r) => [r.value, r.label] as const));
        return roles.map((r) => map.get(r) ?? r).join(", ");
    }, [roles]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm">Crear {title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Define tipo y roles (SAP-like). Roles seleccionados: <span className="font-semibold">{rolesLabel || "—"}</span>
                    </p>
                </div>
            </div>

            <form action={onSubmit} className="p-6">
                {msg && (
                    <div
                        className={[
                            "mb-6 rounded-xl border px-4 py-3 text-sm",
                            msg.type === "success"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : "border-rose-500/20 bg-rose-500/10 text-rose-200",
                        ].join(" ")}
                    >
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Tipo
                        </label>
                        <select
                            value={type}
                            onChange={(e) => {
                                const next = e.target.value as PartnerType;
                                setType(next);

                                // ✅ si quieres forzar defaults cuando cambie el tipo (más consistente)
                                setRoles(defaultRolesForType(next));
                            }}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
                        >
                            <option value="ORGANIZATION">Organización</option>
                            <option value="PERSON">Persona</option>
                        </select>
                    </div>

                    {/* Active */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Estado</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Disponible para operación.</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input name="isActive" type="checkbox" defaultChecked className="size-4 accent-fuchsia-500" />
                            <span className="text-slate-700 dark:text-slate-200">Activo</span>
                        </label>
                    </div>

                    {/* Roles (SAP-like) */}
                    <div className="md:col-span-2">
                        <div className="flex items-end justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Roles del tercero
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Estos roles se usan para filtrar el equipo del proyecto y validar asignaciones.
                                </p>
                            </div>

                            {roles.length === 0 ? (
                                <span className="text-[11px] px-2 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-200">
                                    Selecciona al menos 1
                                </span>
                            ) : (
                                <span className="text-[11px] px-2 py-1 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200">
                                    {roles.length} seleccionado(s)
                                </span>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map((r) => {
                                const active = roles.includes(r.value);
                                return (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => toggleRole(r.value)}
                                        className={[
                                            "text-xs font-bold rounded-full px-3 py-1.5 border transition",
                                            active
                                                ? "border-fuchsia-500/30 bg-linear-to-br from-indigo-500/20 to-fuchsia-500/20 text-slate-100"
                                                : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/20 text-slate-700 dark:text-slate-200 hover:border-fuchsia-500/20",
                                        ].join(" ")}
                                    >
                                        {r.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ORG */}
                    {showOrg && (
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Razón social
                            </label>
                            <input
                                name="organizationName"
                                placeholder="Ej: Remodelaciones Esmeralda S.A.S."
                                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* PERSON */}
                    {showPerson && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Nombre
                                </label>
                                <input
                                    name="firstName"
                                    placeholder="Ej: Esmeralda"
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Apellido
                                </label>
                                <input
                                    name="lastName"
                                    placeholder="Ej: Cárdenas"
                                    className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                                />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            placeholder="correo@dominio.com"
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Teléfono
                        </label>
                        <input
                            name="phone"
                            placeholder="+57 300 000 0000"
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={pending || roles.length === 0}
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                    >
                        {pending ? "Creando..." : "Crear tercero"}
                    </button>
                </div>
            </form>
        </div>
    );
}