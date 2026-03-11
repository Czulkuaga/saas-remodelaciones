"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoBriefcase,
    GoCheckCircle,
    GoInfo,
    GoLaw,
    GoLocation,
    GoMail,
    GoPerson,
    GoShieldCheck,
} from "react-icons/go";
import {
    businessPartnerSchema,
    type BusinessPartnerFormValues,
} from "@/lib/zod/onboarding/business-partner.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = Partial<Record<keyof BusinessPartnerFormValues, string>>;

const LOCATION_RELATION_OPTIONS = [
    {
        value: "REGISTERED_OFFICE",
        title: "Oficina registrada",
        description: "Dirección legal o principal de la organización.",
    },
    {
        value: "TRADING_FACILITY",
        title: "Sede operativa",
        description: "Instalación o punto principal de operación.",
    },
    {
        value: "MAILING_ADDRESS",
        title: "Dirección de correspondencia",
        description: "Ubicación usada para comunicaciones y envíos.",
    },
] as const;

const ROLE_OPTIONS = [
    { value: "TENANT_OWNER", label: "Propietario del tenant" },
    { value: "CUSTOMER", label: "Cliente principal" },
    { value: "VENDOR", label: "Proveedor" },
];

export function BusinessPartnerForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<BusinessPartnerFormValues>(
        () => ({
            legalName: draft.businessPartner.legalName,
            tradeName: draft.businessPartner.tradeName,
            identifierType: draft.businessPartner.identifierType,
            identifierValue: draft.businessPartner.identifierValue,
            mainContactName: draft.businessPartner.mainContactName,
            email: draft.businessPartner.email,
            phone: draft.businessPartner.phone,
            locationRelationType: draft.businessPartner.locationRelationType,
            roleKey: draft.businessPartner.roleKey,
        }),
        [draft.businessPartner]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof BusinessPartnerFormValues>(
        field: K,
        value: BusinessPartnerFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            businessPartner: {
                ...prev.businessPartner,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof BusinessPartnerFormValues>(
        field: K,
        value: BusinessPartnerFormValues[K]
    ) {
        const result = businessPartnerSchema.shape[field].safeParse(value);

        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0]?.message,
        }));
    }

    function validateForm() {
        const result = businessPartnerSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof BusinessPartnerFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/admin-user");
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    const linkedAddress = [
        draft.structure.addressLine1,
        draft.structure.city,
        draft.structure.postalCode,
        draft.structure.countryCode,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoLaw className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Identidad legal
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Define la entidad jurídica principal asociada al tenant.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Razón social
                            </label>
                            <input
                                value={values.legalName}
                                onChange={(e) => setField("legalName", e.target.value)}
                                onBlur={(e) => validateField("legalName", e.target.value)}
                                placeholder="Ej. Esmeralda Remodeling SAS"
                                className={inputClass(errors.legalName)}
                            />
                            {errors.legalName ? (
                                <p className="text-xs text-rose-400">{errors.legalName}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre comercial
                            </label>
                            <input
                                value={values.tradeName ?? ""}
                                onChange={(e) => setField("tradeName", e.target.value)}
                                onBlur={(e) => validateField("tradeName", e.target.value)}
                                placeholder="Ej. Esmeralda Remodeling"
                                className={inputClass(errors.tradeName)}
                            />
                            {errors.tradeName ? (
                                <p className="text-xs text-rose-400">{errors.tradeName}</p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Opcional si coincide con la razón social.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Tipo ID
                                </label>
                                <select
                                    value={values.identifierType}
                                    onChange={(e) => setField("identifierType", e.target.value)}
                                    onBlur={(e) => validateField("identifierType", e.target.value)}
                                    className={inputClass(errors.identifierType)}
                                >
                                    <option value="NIT">NIT</option>
                                    <option value="VAT">VAT</option>
                                    <option value="EIN">EIN</option>
                                    <option value="TIN">TIN</option>
                                    <option value="REGISTRATION">Registro mercantil</option>
                                </select>
                                {errors.identifierType ? (
                                    <p className="text-xs text-rose-400">{errors.identifierType}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Identificador
                                </label>
                                <input
                                    value={values.identifierValue}
                                    onChange={(e) => setField("identifierValue", e.target.value)}
                                    onBlur={(e) => validateField("identifierValue", e.target.value)}
                                    placeholder="Ej. 900123456-7"
                                    className={inputClass(errors.identifierValue)}
                                />
                                {errors.identifierValue ? (
                                    <p className="text-xs text-rose-400">{errors.identifierValue}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Rol principal del business partner
                            </label>
                            <select
                                value={values.roleKey}
                                onChange={(e) => setField("roleKey", e.target.value)}
                                onBlur={(e) => validateField("roleKey", e.target.value)}
                                className={inputClass(errors.roleKey)}
                            >
                                {ROLE_OPTIONS.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {errors.roleKey ? (
                                <p className="text-xs text-rose-400">{errors.roleKey}</p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                            <GoMail className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Datos de contacto principal
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Persona o canal principal de contacto para esta entidad.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre del contacto principal
                            </label>
                            <div className="relative">
                                <GoPerson className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={values.mainContactName}
                                    onChange={(e) => setField("mainContactName", e.target.value)}
                                    onBlur={(e) => validateField("mainContactName", e.target.value)}
                                    placeholder="Ej. César Zuluaga"
                                    className={`${inputClass(errors.mainContactName)} pl-11`}
                                />
                            </div>
                            {errors.mainContactName ? (
                                <p className="text-xs text-rose-400">{errors.mainContactName}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={values.email}
                                onChange={(e) => setField("email", e.target.value)}
                                onBlur={(e) => validateField("email", e.target.value)}
                                placeholder="contacto@empresa.com"
                                className={inputClass(errors.email)}
                            />
                            {errors.email ? (
                                <p className="text-xs text-rose-400">{errors.email}</p>
                            ) : null}
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
                    </div>
                </section>

                <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoLocation className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Relación con la ubicación principal
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Vincula este business partner con la ubicación creada en el paso anterior.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {LOCATION_RELATION_OPTIONS.map((option) => {
                            const active = values.locationRelationType === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setField("locationRelationType", option.value)
                                    }
                                    className={[
                                        "rounded-2xl border p-4 text-left transition",
                                        active
                                            ? "border-fuchsia-500/30 bg-fuchsia-500/10"
                                            : "border-slate-800 bg-slate-950/70 hover:border-slate-700",
                                    ].join(" ")}
                                >
                                    <p
                                        className={[
                                            "text-sm font-semibold",
                                            active ? "text-fuchsia-300" : "text-slate-200",
                                        ].join(" ")}
                                    >
                                        {option.title}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-slate-400">
                                        {option.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {errors.locationRelationType ? (
                        <p className="mt-3 text-xs text-rose-400">
                            {errors.locationRelationType}
                        </p>
                    ) : null}

                    <div className="mt-5 flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-slate-300">
                            <GoLocation className="text-lg" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Ubicación vinculada
                            </p>
                            <p className="mt-2 text-sm text-slate-200">
                                {linkedAddress || "Aún no hay dirección registrada"}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/structure")}
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
                        <FaArrowRight />
                    </button>
                </div>
            </div>

            <aside className="xl:sticky xl:top-24 xl:h-fit">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-2xl">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Resumen previo
                    </h3>

                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                                Tipo de entidad
                            </p>
                            <p className="mt-2 text-sm font-medium italic text-slate-100">
                                Organization Master Partner
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center gap-2 text-slate-300">
                                <GoBriefcase className="text-lg" />
                                <p className="text-sm font-medium">Resumen del partner</p>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Razón social</dt>
                                    <dd className="text-right text-slate-200">
                                        {values.legalName || "-"}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Identificador</dt>
                                    <dd className="text-right text-slate-200">
                                        {values.identifierType} {values.identifierValue || ""}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Contacto</dt>
                                    <dd className="text-right text-slate-200">
                                        {values.mainContactName || "-"}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Email</dt>
                                    <dd className="max-w-37.5 wrap-break-word text-right text-slate-200">
                                        {values.email || "-"}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Rol</dt>
                                    <dd className="text-right text-slate-200">
                                        {ROLE_OPTIONS.find((x) => x.value === values.roleKey)?.label ?? "-"}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start gap-3">
                                <GoInfo className="mt-0.5 text-slate-500" />
                                <p className="text-xs leading-5 text-slate-400">
                                    Este registro será usado como base para facturación, acuerdos,
                                    referencia legal y reportes de alto nivel dentro del tenant.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <GoShieldCheck className="text-lg" />
                                <p className="text-sm font-medium">Entidad válida para continuar</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                                La configuración actual es suficiente para crear el business partner
                                principal del tenant.
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}