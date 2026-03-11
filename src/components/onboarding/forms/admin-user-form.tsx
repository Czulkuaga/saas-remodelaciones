"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoInfo,
    GoLock,
    GoMail,
    GoPerson,
    GoShieldCheck,
    GoStar,
} from "react-icons/go";
import {
    adminUserSchema,
    type AdminUserFormValues,
} from "@/lib/zod/onboarding/admin-user.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = Partial<Record<keyof AdminUserFormValues, string>>;

const LANGUAGE_OPTIONS = [
    { value: "es-CO", label: "Español (Colombia)" },
    { value: "es-ES", label: "Español (España)" },
    { value: "en-US", label: "English (US)" },
    { value: "fr-BE", label: "Français (Belgique)" },
];

const MEMBERSHIP_ROLE_OPTIONS = [
    { value: "ADMIN", label: "Administrador" },
    { value: "OWNER", label: "Owner" },
];

function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

export function AdminUserForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);

    const values = useMemo<AdminUserFormValues>(
        () => ({
            firstName: draft.adminUser.firstName,
            lastName: draft.adminUser.lastName,
            email: draft.adminUser.email || draft.businessPartner.email,
            phone: draft.adminUser.phone || draft.businessPartner.phone,
            preferredLanguage:
                draft.adminUser.preferredLanguage || draft.regional.systemLanguage,
            setupPasswordNow: draft.adminUser.setupPasswordNow,
            password: draft.adminUser.password,
            membershipRoleKey: draft.adminUser.membershipRoleKey,
        }),
        [draft.adminUser, draft.businessPartner.email, draft.businessPartner.phone, draft.regional.systemLanguage]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof AdminUserFormValues>(
        field: K,
        value: AdminUserFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            adminUser: {
                ...prev.adminUser,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof AdminUserFormValues>(
        field: K,
        value: AdminUserFormValues[K]
    ) {
        const candidate = { ...values, [field]: value };
        const result = adminUserSchema.safeParse(candidate);

        if (result.success) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
            return;
        }

        const issue = result.error.issues.find((x) => x.path[0] === field);

        setErrors((prev) => ({
            ...prev,
            [field]: issue?.message,
        }));
    }

    function validateForm() {
        const result = adminUserSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof AdminUserFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/roles");
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    const passwordStrength = getPasswordStrength(values.password);
    const strengthLabel =
        passwordStrength <= 1
            ? "Débil"
            : passwordStrength === 2
                ? "Media"
                : passwordStrength === 3
                    ? "Buena"
                    : "Fuerte";

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoStar className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Datos del administrador
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Este usuario será el propietario operativo inicial del tenant.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre
                            </label>
                            <input
                                value={values.firstName}
                                onChange={(e) => setField("firstName", e.target.value)}
                                onBlur={(e) => validateField("firstName", e.target.value)}
                                placeholder="Ej. César"
                                className={inputClass(errors.firstName)}
                            />
                            {errors.firstName ? (
                                <p className="text-xs text-rose-400">{errors.firstName}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Apellido
                            </label>
                            <input
                                value={values.lastName}
                                onChange={(e) => setField("lastName", e.target.value)}
                                onBlur={(e) => validateField("lastName", e.target.value)}
                                placeholder="Ej. Zuluaga"
                                className={inputClass(errors.lastName)}
                            />
                            {errors.lastName ? (
                                <p className="text-xs text-rose-400">{errors.lastName}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <GoMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={values.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    onBlur={(e) => validateField("email", e.target.value)}
                                    placeholder="admin@empresa.com"
                                    className={`${inputClass(errors.email)} pl-11`}
                                />
                            </div>
                            {errors.email ? (
                                <p className="text-xs text-rose-400">{errors.email}</p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Puede venir prellenado desde el business partner principal.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={values.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                onBlur={(e) => validateField("phone", e.target.value)}
                                placeholder="+57 300 000 0000"
                                className={inputClass(errors.phone)}
                            />
                            {errors.phone ? (
                                <p className="text-xs text-rose-400">{errors.phone}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Idioma preferido
                            </label>
                            <select
                                value={values.preferredLanguage}
                                onChange={(e) => setField("preferredLanguage", e.target.value)}
                                onBlur={(e) =>
                                    validateField("preferredLanguage", e.target.value)
                                }
                                className={inputClass(errors.preferredLanguage)}
                            >
                                {LANGUAGE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            {errors.preferredLanguage ? (
                                <p className="text-xs text-rose-400">
                                    {errors.preferredLanguage}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Rol inicial de membresía
                            </label>
                            <select
                                value={values.membershipRoleKey}
                                onChange={(e) => setField("membershipRoleKey", e.target.value)}
                                onBlur={(e) =>
                                    validateField("membershipRoleKey", e.target.value)
                                }
                                className={inputClass(errors.membershipRoleKey)}
                            >
                                {MEMBERSHIP_ROLE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            {errors.membershipRoleKey ? (
                                <p className="text-xs text-rose-400">
                                    {errors.membershipRoleKey}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Configuración de acceso
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Define si el administrador tendrá contraseña inicial desde este paso.
                            </p>
                        </div>

                        <label className="inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={values.setupPasswordNow}
                                onChange={(e) => setField("setupPasswordNow", e.target.checked)}
                            />
                            <div className="relative h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-fuchsia-500 after:absolute after:inset-s-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <GoLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={values.password}
                                onChange={(e) => setField("password", e.target.value)}
                                onBlur={(e) => validateField("password", e.target.value)}
                                placeholder={
                                    values.setupPasswordNow
                                        ? "Crea una contraseña fuerte"
                                        : "Contraseña opcional por ahora"
                                }
                                disabled={!values.setupPasswordNow}
                                className={`${inputClass(errors.password)} pl-11 disabled:cursor-not-allowed disabled:opacity-50`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition hover:text-slate-200"
                            >
                                {showPassword ? "Ocultar" : "Ver"}
                            </button>
                        </div>

                        {errors.password ? (
                            <p className="text-xs text-rose-400">{errors.password}</p>
                        ) : null}

                        {values.setupPasswordNow ? (
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
                                    {strengthLabel}
                                </span>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                <p className="text-xs text-slate-400">
                                    Más adelante podrás reemplazar este flujo por invitación o activación por correo.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/business-partner")}
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

            <aside className="xl:sticky xl:top-24 xl:h-fit">
                <div className="space-y-4">
                    <div className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300">
                            <GoShieldCheck className="text-lg" />
                            Responsabilidades del owner
                        </h3>

                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li>Gestionar seguridad y autenticación.</li>
                            <li>Administrar usuarios, membresías y accesos.</li>
                            <li>Controlar configuración general del tenant.</li>
                        </ul>

                        <p className="mt-4 border-t border-fuchsia-500/10 pt-4 text-xs leading-5 text-slate-400">
                            Este rol podrá transferirse a otro administrador más adelante.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
                        <div className="relative aspect-square bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.16),rgba(15,23,42,0.92)_60%)]">
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/10 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 p-6">
                                    <GoPerson className="text-5xl text-fuchsia-300" />
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Cuenta principal
                                </p>
                                <p className="mt-1 text-sm font-medium text-white">
                                    {[values.firstName, values.lastName].filter(Boolean).join(" ") || "Administrador inicial"}
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    {values.email || "Sin correo configurado"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="mb-3 flex items-center gap-2 text-slate-300">
                            <GoInfo className="text-lg" />
                            <p className="text-sm font-medium">Resumen del usuario</p>
                        </div>

                        <dl className="space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Nombre</dt>
                                <dd className="text-right text-slate-200">
                                    {[values.firstName, values.lastName].filter(Boolean).join(" ") || "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Email</dt>
                                <dd className="max-w-37.5 wrap-break-word text-right text-slate-200">
                                    {values.email || "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Idioma</dt>
                                <dd className="text-right text-slate-200">
                                    {LANGUAGE_OPTIONS.find((x) => x.value === values.preferredLanguage)?.label ?? "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Rol</dt>
                                <dd className="text-right text-slate-200">
                                    {MEMBERSHIP_ROLE_OPTIONS.find((x) => x.value === values.membershipRoleKey)?.label ?? "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Acceso</dt>
                                <dd className="text-right text-slate-200">
                                    {values.setupPasswordNow ? "Con contraseña" : "Pendiente"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <GoCheckCircle className="text-lg" />
                            <p className="text-sm font-medium">Usuario válido para continuar</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            Esta cuenta tiene la información mínima necesaria para ser el administrador inicial del tenant.
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}