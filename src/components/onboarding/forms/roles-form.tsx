"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoInfo,
    GoKey,
    GoPersonAdd,
    GoShieldCheck,
    GoTools,
} from "react-icons/go";
import {
    rolesSchema,
    type RolesFormValues,
    type OnboardingRoleFormItem,
} from "@/lib/zod/onboarding/roles.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = {
    preset?: string;
    adminAssignedRoleKey?: string;
    roles?: string;
};

const PERMISSION_CATEGORIES = [
    {
        key: "tenant",
        title: "Tenant y configuración",
        permissions: [
            { key: "tenant.read", label: "Ver tenant", description: "Consulta general de configuración." },
            { key: "tenant.write", label: "Editar tenant", description: "Cambios estructurales y de configuración." },
        ],
    },
    {
        key: "users",
        title: "Usuarios y accesos",
        permissions: [
            { key: "users.read", label: "Ver usuarios", description: "Consulta de usuarios y membresías." },
            { key: "users.write", label: "Gestionar usuarios", description: "Crear, editar o desactivar usuarios." },
            { key: "roles.read", label: "Ver roles", description: "Consultar roles y permisos." },
            { key: "roles.write", label: "Gestionar roles", description: "Crear o modificar roles del tenant." },
        ],
    },
    {
        key: "projects",
        title: "Proyectos y presupuestos",
        permissions: [
            { key: "projects.read", label: "Ver proyectos", description: "Consulta de proyectos." },
            { key: "projects.write", label: "Gestionar proyectos", description: "Crear o editar proyectos." },
            { key: "budgets.read", label: "Ver presupuestos", description: "Consulta de presupuestos." },
            { key: "budgets.write", label: "Gestionar presupuestos", description: "Crear, editar y aprobar." },
        ],
    },
    {
        key: "billing",
        title: "Facturación",
        permissions: [
            { key: "billing.read", label: "Ver facturación", description: "Consulta de facturas y plan." },
            { key: "billing.write", label: "Gestionar facturación", description: "Editar métodos y configuración." },
        ],
    },
];

function buildPresetRoles(
    preset: "STANDARD" | "ENTERPRISE_CORE" | "MINIMAL"
): OnboardingRoleFormItem[] {
    if (preset === "MINIMAL") {
        return [
            {
                key: "ADMIN",
                name: "Administrator",
                description: "Acceso total al tenant.",
                isSystem: true,
                permissions: ["tenant.read", "tenant.write", "users.read", "users.write"],
            },
            {
                key: "VIEWER",
                name: "Viewer",
                description: "Acceso básico de consulta.",
                isSystem: false,
                permissions: ["users.read", "projects.read", "budgets.read"],
            },
        ];
    }

    if (preset === "STANDARD") {
        return [
            {
                key: "ADMIN",
                name: "Administrator",
                description: "Acceso administrativo completo.",
                isSystem: true,
                permissions: [
                    "tenant.read",
                    "tenant.write",
                    "users.read",
                    "users.write",
                    "roles.read",
                    "projects.read",
                    "projects.write",
                    "budgets.read",
                    "budgets.write",
                    "billing.read",
                ],
            },
            {
                key: "MANAGER",
                name: "Manager",
                description: "Gestión operativa.",
                isSystem: false,
                permissions: [
                    "users.read",
                    "projects.read",
                    "projects.write",
                    "budgets.read",
                    "budgets.write",
                ],
            },
            {
                key: "VIEWER",
                name: "Viewer",
                description: "Consulta general.",
                isSystem: false,
                permissions: ["users.read", "projects.read", "budgets.read"],
            },
        ];
    }

    return [
        {
            key: "ADMIN",
            name: "Administrator",
            description: "Acceso total al tenant.",
            isSystem: true,
            permissions: [
                "tenant.read",
                "tenant.write",
                "users.read",
                "users.write",
                "roles.read",
                "roles.write",
                "projects.read",
                "projects.write",
                "budgets.read",
                "budgets.write",
                "billing.read",
                "billing.write",
            ],
        },
        {
            key: "MANAGER",
            name: "Manager",
            description: "Gestión operativa sin control completo del tenant.",
            isSystem: false,
            permissions: [
                "users.read",
                "projects.read",
                "projects.write",
                "budgets.read",
                "budgets.write",
            ],
        },
        {
            key: "VIEWER",
            name: "Viewer",
            description: "Acceso de solo lectura.",
            isSystem: false,
            permissions: ["users.read", "projects.read", "budgets.read"],
        },
    ];
}

export function RolesForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});
    const [selectedRoleKey, setSelectedRoleKey] = useState("ADMIN");

    const values = useMemo<RolesFormValues>(
        () => ({
            preset: draft.roles.preset,
            roles: draft.roles.roles,
            adminAssignedRoleKey: draft.roles.adminAssignedRoleKey,
        }),
        [draft.roles]
    );

    const selectedRole =
        values.roles.find((role) => role.key === selectedRoleKey) ?? values.roles[0];

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function validateForm() {
        const result = rolesSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof FormErrors;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/number-ranges");
    }

    function applyPreset(preset: "STANDARD" | "ENTERPRISE_CORE" | "MINIMAL") {
        const roles = buildPresetRoles(preset);

        updateDraft((prev) => ({
            ...prev,
            roles: {
                ...prev.roles,
                preset,
                roles,
                adminAssignedRoleKey: "ADMIN",
            },
            adminUser: {
                ...prev.adminUser,
                membershipRoleKey: "ADMIN",
            },
        }));

        setSelectedRoleKey("ADMIN");
        setErrors({});
    }

    function addRoleTemplate(template: "MANAGER" | "VIEWER") {
        updateDraft((prev) => {
            const exists = prev.roles.roles.some((role) => role.key === template);
            if (exists) return prev;

            const newRole =
                template === "MANAGER"
                    ? {
                        key: "MANAGER",
                        name: "Manager",
                        description: "Gestión operativa.",
                        isSystem: false,
                        permissions: [
                            "users.read",
                            "projects.read",
                            "projects.write",
                            "budgets.read",
                            "budgets.write",
                        ],
                    }
                    : {
                        key: "VIEWER",
                        name: "Viewer",
                        description: "Acceso de consulta.",
                        isSystem: false,
                        permissions: ["users.read", "projects.read", "budgets.read"],
                    };

            return {
                ...prev,
                roles: {
                    ...prev.roles,
                    roles: [...prev.roles.roles, newRole],
                },
            };
        });
    }

    function togglePermission(roleKey: string, permissionKey: string) {
        updateDraft((prev) => ({
            ...prev,
            roles: {
                ...prev.roles,
                roles: prev.roles.roles.map((role) => {
                    if (role.key !== roleKey || role.isSystem) return role;

                    const hasPermission = role.permissions.includes(permissionKey);

                    return {
                        ...role,
                        permissions: hasPermission
                            ? role.permissions.filter((p) => p !== permissionKey)
                            : [...role.permissions, permissionKey],
                    };
                }),
            },
        }));
    }

    function assignAdminRole(roleKey: string) {
        updateDraft((prev) => ({
            ...prev,
            roles: {
                ...prev.roles,
                adminAssignedRoleKey: roleKey,
            },
            adminUser: {
                ...prev.adminUser,
                membershipRoleKey: roleKey,
            },
        }));
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
                <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoTools className="text-lg" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-100">
                                Presets de seguridad
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Aplica una base rápida para iniciar.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyPreset("STANDARD")}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${values.preset === "STANDARD"
                                    ? "bg-fuchsia-500 text-white"
                                    : "border border-slate-800 bg-slate-950 text-slate-300"
                                }`}
                        >
                            Standard SaaS
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("ENTERPRISE_CORE")}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${values.preset === "ENTERPRISE_CORE"
                                    ? "bg-fuchsia-500 text-white"
                                    : "border border-slate-800 bg-slate-950 text-slate-300"
                                }`}
                        >
                            Enterprise Core
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("MINIMAL")}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${values.preset === "MINIMAL"
                                    ? "bg-fuchsia-500 text-white"
                                    : "border border-slate-800 bg-slate-950 text-slate-300"
                                }`}
                        >
                            Minimal
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-100">Roles activos</h3>
                        <button
                            type="button"
                            onClick={() => addRoleTemplate("MANAGER")}
                            className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
                        >
                            + Manager
                        </button>
                    </div>

                    <div className="space-y-3">
                        {values.roles.map((role) => {
                            const isSelected = selectedRoleKey === role.key;
                            const isAssigned = values.adminAssignedRoleKey === role.key;

                            return (
                                <button
                                    key={role.key}
                                    type="button"
                                    onClick={() => setSelectedRoleKey(role.key)}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${isSelected
                                            ? "border-fuchsia-500/30 bg-fuchsia-500/10"
                                            : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-100">
                                                {role.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {role.description || "Sin descripción"}
                                            </p>
                                        </div>

                                        {role.isSystem ? (
                                            <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                                System
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs">
                                        <span className="text-slate-500">
                                            {role.permissions.length} permisos
                                        </span>
                                        {isAssigned ? (
                                            <span className="text-emerald-400">Asignado al admin</span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}

                        {!values.roles.some((x) => x.key === "VIEWER") ? (
                            <button
                                type="button"
                                onClick={() => addRoleTemplate("VIEWER")}
                                className="w-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-left transition hover:border-slate-600"
                            >
                                <div className="flex items-center gap-3">
                                    <GoPersonAdd className="text-slate-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-300">
                                            Agregar rol Viewer
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Acceso de solo lectura
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                    <h3 className="text-sm font-semibold text-slate-100">
                        Rol para administrador inicial
                    </h3>

                    <div className="mt-4 space-y-2">
                        {values.roles.map((role) => (
                            <label
                                key={role.key}
                                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{role.name}</p>
                                    <p className="text-xs text-slate-500">{role.key}</p>
                                </div>

                                <input
                                    type="radio"
                                    name="adminAssignedRoleKey"
                                    checked={values.adminAssignedRoleKey === role.key}
                                    onChange={() => assignAdminRole(role.key)}
                                    className="h-4 w-4 border-slate-700 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500"
                                />
                            </label>
                        ))}
                    </div>

                    {errors.adminAssignedRoleKey ? (
                        <p className="mt-3 text-xs text-rose-400">
                            {errors.adminAssignedRoleKey}
                        </p>
                    ) : null}
                </section>
            </div>

            <div className="space-y-6">
                <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <GoKey className="text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-100">
                                Permisos: {selectedRole?.name ?? "Rol"}
                            </h3>
                        </div>

                        {selectedRole?.isSystem ? (
                            <span className="text-xs font-semibold text-fuchsia-300">
                                Rol protegido
                            </span>
                        ) : null}
                    </div>

                    <div className="space-y-6 p-6">
                        {PERMISSION_CATEGORIES.map((category) => (
                            <div key={category.key}>
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {category.title}
                                </h4>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {category.permissions.map((permission) => {
                                        const checked =
                                            selectedRole?.permissions.includes(permission.key) ?? false;

                                        return (
                                            <label
                                                key={permission.key}
                                                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {permission.label}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {permission.description}
                                                    </p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={selectedRole?.isSystem}
                                                    onChange={() =>
                                                        selectedRole &&
                                                        togglePermission(selectedRole.key, permission.key)
                                                    }
                                                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500 disabled:opacity-50"
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {errors.roles ? (
                            <p className="text-xs text-rose-400">{errors.roles}</p>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-start gap-3">
                        <GoInfo className="mt-0.5 text-slate-500" />
                        <p className="text-sm leading-6 text-slate-400">
                            Los permisos son globales del sistema, pero la combinación final se
                            guarda dentro de roles propios del tenant.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <GoShieldCheck className="text-lg" />
                        <p className="text-sm font-medium">Configuración de acceso válida</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Ya existe un rol administrador y el usuario inicial tiene una asignación válida.
                    </p>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/admin-user")}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200 cursor-pointer"
                    >
                        Atrás
                    </button>

                    <button
                        type="button"
                        onClick={handleContinue}
                        className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 cursor-pointer"
                    >
                        Continuar
                        <FaArrowRight size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
}