"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoBriefcase,
    GoCheckCircle,
    GoInfo,
    GoLaw,
    GoLocation,
    GoMail,
    GoOrganization,
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
        description: "Dirección legal o principal de la entidad.",
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

const PERSON_TYPES = [
    {
        value: "ORGANIZATION",
        title: "Organización",
        description: "Empresa, sociedad, entidad jurídica o razón social.",
    },
    {
        value: "INDIVIDUAL",
        title: "Persona natural",
        description: "Persona individual con documento e identificación propia.",
    },
] as const;

export function BusinessPartnerForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<BusinessPartnerFormValues>(
        () => ({
            personType: draft.businessPartner.personType ?? "ORGANIZATION",
            legalName: draft.businessPartner.legalName ?? "",
            tradeName: draft.businessPartner.tradeName ?? "",
            firstName: draft.businessPartner.firstName ?? "",
            lastName: draft.businessPartner.lastName ?? "",
            identifierType: draft.businessPartner.identifierType ?? "NIT",
            identifierValue: draft.businessPartner.identifierValue ?? "",
            mainContactName: draft.businessPartner.mainContactName ?? "",
            email: draft.businessPartner.email ?? "",
            phone: draft.businessPartner.phone ?? "",
            locationRelationType:
                draft.businessPartner.locationRelationType ?? "REGISTERED_OFFICE",
            roleKey: draft.businessPartner.roleKey ?? "TENANT_OWNER",
        }),
        [draft.businessPartner]
    );

    useEffect(() => {
        if (!hydrated) return;

        updateDraft((prev) => {
            if (prev.businessPartner.personType !== "INDIVIDUAL") return prev;

            const fullName = [
                prev.businessPartner.firstName ?? "",
                prev.businessPartner.lastName ?? "",
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

            if (!fullName) return prev;
            if (prev.businessPartner.mainContactName === fullName) return prev;

            return {
                ...prev,
                businessPartner: {
                    ...prev.businessPartner,
                    mainContactName: fullName,
                },
            };
        });
    }, [hydrated, updateDraft]);

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
        const candidate = { ...values, [field]: value };
        const result = businessPartnerSchema.safeParse(candidate);

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

    function handlePersonTypeChange(nextType: "ORGANIZATION" | "INDIVIDUAL") {
        updateDraft((prev) => ({
            ...prev,
            businessPartner: {
                ...prev.businessPartner,
                personType: nextType,
                legalName:
                    nextType === "ORGANIZATION"
                        ? prev.businessPartner.legalName
                        : prev.businessPartner.legalName,
                tradeName:
                    nextType === "ORGANIZATION" ? prev.businessPartner.tradeName : "",
                firstName:
                    nextType === "INDIVIDUAL" ? prev.businessPartner.firstName : "",
                lastName:
                    nextType === "INDIVIDUAL" ? prev.businessPartner.lastName : "",
                mainContactName:
                    nextType === "ORGANIZATION"
                        ? prev.businessPartner.mainContactName
                        : [
                            prev.businessPartner.firstName ?? "",
                            prev.businessPartner.lastName ?? "",
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim(),
            },
        }));

        setErrors({});
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

    const summaryName =
        values.personType === "INDIVIDUAL"
            ? [values.firstName ?? "", values.lastName ?? ""].filter(Boolean).join(" ")
            : values.legalName ?? "";

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Tipo de business partner
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Define si el partner principal será una organización o una persona natural.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {PERSON_TYPES.map((item) => {
                            const active = values.personType === item.value;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => handlePersonTypeChange(item.value)}
                                    className={[
                                        "rounded-2xl border p-5 text-left transition",
                                        active
                                            ? "border-fuchsia-500/30 bg-fuchsia-500/10"
                                            : "border-slate-800 bg-slate-950/70 hover:border-slate-700",
                                    ].join(" ")}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                                            {item.value === "ORGANIZATION" ? (
                                                <GoOrganization className="text-lg" />
                                            ) : (
                                                <GoPerson className="text-lg" />
                                            )}
                                        </div>
                                        <p
                                            className={[
                                                "text-sm font-semibold",
                                                active ? "text-fuchsia-300" : "text-slate-100",
                                            ].join(" ")}
                                        >
                                            {item.title}
                                        </p>
                                    </div>

                                    <p className="text-sm leading-6 text-slate-400">
                                        {item.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {errors.personType ? (
                        <p className="mt-3 text-xs text-rose-400">{errors.personType}</p>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoLaw className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Identidad principal
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Define la identidad legal del business partner principal.
                            </p>
                        </div>
                    </div>

                    {values.personType === "ORGANIZATION" ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Razón social
                                </label>
                                <input
                                    value={values.legalName ?? ""}
                                    onChange={(e) => setField("legalName", e.target.value)}
                                    onBlur={(e) => validateField("legalName", e.target.value)}
                                    placeholder="Ej. Esmeralda Remodeling SAS"
                                    className={inputClass(errors.legalName)}
                                />
                                {errors.legalName ? (
                                    <p className="text-xs text-rose-400">{errors.legalName}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2 md:col-span-2">
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

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Contacto principal
                                </label>
                                <input
                                    value={values.mainContactName ?? ""}
                                    onChange={(e) => setField("mainContactName", e.target.value)}
                                    onBlur={(e) =>
                                        validateField("mainContactName", e.target.value)
                                    }
                                    placeholder="Ej. César Zuluaga"
                                    className={inputClass(errors.mainContactName)}
                                />
                                {errors.mainContactName ? (
                                    <p className="text-xs text-rose-400">
                                        {errors.mainContactName}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Nombres
                                </label>
                                <input
                                    value={values.firstName ?? ""}
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
                                    Apellidos
                                </label>
                                <input
                                    value={values.lastName ?? ""}
                                    onChange={(e) => setField("lastName", e.target.value)}
                                    onBlur={(e) => validateField("lastName", e.target.value)}
                                    placeholder="Ej. Zuluaga"
                                    className={inputClass(errors.lastName)}
                                />
                                {errors.lastName ? (
                                    <p className="text-xs text-rose-400">{errors.lastName}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Nombre completo
                                </label>
                                <input
                                    value={values.mainContactName ?? ""}
                                    readOnly
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500">
                                    Se construye automáticamente a partir de nombres y apellidos.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 grid grid-cols-[140px_minmax(0,1fr)] gap-4">
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
                                <option value="CC">Cédula</option>
                                <option value="CE">Cédula extranjería</option>
                                <option value="PASSPORT">Pasaporte</option>
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
                                placeholder={
                                    values.personType === "ORGANIZATION"
                                        ? "Ej. 900123456-7"
                                        : "Ej. 1032456789"
                                }
                                className={inputClass(errors.identifierValue)}
                            />
                            {errors.identifierValue ? (
                                <p className="text-xs text-rose-400">{errors.identifierValue}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-5 space-y-2">
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
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                            <GoMail className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Datos de contacto
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Información principal para comunicación y relación operativa.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                                type="number"
                                value={values.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                onBlur={(e) => validateField("phone", e.target.value)}
                                placeholder="300 000 0000"
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
                                Vincula este partner con la ubicación creada en el paso anterior.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {LOCATION_RELATION_OPTIONS.map((option) => {
                            const active = values.locationRelationType === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setField("locationRelationType", option.value)}
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
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                    >
                        Atrás
                    </button>

                    <button
                        type="button"
                        onClick={handleContinue}
                        className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                    >
                        Continuar
                        <FaArrowRight size={18}/>
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
                                {values.personType === "ORGANIZATION"
                                    ? "Organization Master Partner"
                                    : "Individual Master Partner"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center gap-2 text-slate-300">
                                <GoBriefcase className="text-lg" />
                                <p className="text-sm font-medium">Resumen del partner</p>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Nombre principal</dt>
                                    <dd className="text-right text-slate-200">
                                        {summaryName || "-"}
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