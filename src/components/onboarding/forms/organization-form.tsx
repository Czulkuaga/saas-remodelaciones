"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    organizationSchema,
    type OrganizationFormValues,
} from "@/lib/zod/onboarding/organization.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { MdOutlineVerifiedUser } from "react-icons/md";

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

type FormErrors = Partial<Record<keyof OrganizationFormValues, string>>;

export function OrganizationForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<OrganizationFormValues>(
        () => ({
            legalName: draft.organization.legalName,
            displayName: draft.organization.displayName,
            slug: draft.organization.slug,
            code: draft.organization.code,
            primaryCountry: draft.organization.primaryCountry,
            defaultCurrency: draft.organization.defaultCurrency,
            defaultTimeZone: draft.organization.defaultTimeZone,
            defaultLocale: draft.organization.defaultLocale,
        }),
        [draft.organization]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof OrganizationFormValues>(
        field: K,
        value: OrganizationFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            organization: {
                ...prev.organization,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof OrganizationFormValues>(
        field: K,
        value: OrganizationFormValues[K]
    ) {
        const result = organizationSchema.shape[field].safeParse(value);

        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0]?.message,
        }));
    }

    function validateForm() {
        const result = organizationSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof OrganizationFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        const isValid = validateForm();
        if (!isValid) return;
        handleSaveDraft()
        router.push("/onboarding/branding");
    }

    function handleSaveDraft() {
        const result = organizationSchema.safeParse(values);

        if (!result.success) {
            const softErrors: FormErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof OrganizationFormValues;
                if (!softErrors[field]) {
                    softErrors[field] = issue.message;
                }
            }
            setErrors(softErrors);
        }
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-100">
                        Información principal
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Estos datos identifican tu organización y servirán como base para la
                        configuración inicial.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Nombre legal
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
                            value={values.displayName}
                            onChange={(e) => {
                                const displayName = e.target.value;
                                setField("displayName", displayName);

                                if (!values.slug.trim()) {
                                    setField("slug", slugify(displayName));
                                }
                            }}
                            onBlur={(e) => validateField("displayName", e.target.value)}
                            placeholder="Ej. Esmeralda Remodeling"
                            className={inputClass(errors.displayName)}
                        />
                        {errors.displayName ? (
                            <p className="text-xs text-rose-400">{errors.displayName}</p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 space-y-2">
                    <label className="text-sm font-medium text-slate-300">Slug</label>
                    <div
                        className={[
                            "flex overflow-hidden rounded-xl border bg-slate-950",
                            errors.slug
                                ? "border-rose-500/50"
                                : "border-slate-800 focus-within:border-fuchsia-500/40",
                        ].join(" ")}
                    >
                        <div className="flex items-center border-r border-slate-800 px-4 text-sm text-slate-500">
                            https://
                        </div>
                        <input
                            value={values.slug}
                            onChange={(e) => setField("slug", slugify(e.target.value))}
                            onBlur={(e) => validateField("slug", slugify(e.target.value))}
                            placeholder="mi-organizacion"
                            className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                        />
                    </div>
                    {errors.slug ? (
                        <p className="text-xs text-rose-400">{errors.slug}</p>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Se usará como identificador amigable del tenant.
                        </p>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Código interno
                        </label>
                        <input
                            value={values.code}
                            onChange={(e) => setField("code", e.target.value.toUpperCase())}
                            onBlur={(e) =>
                                validateField("code", e.target.value.toUpperCase())
                            }
                            placeholder="Ej. ESM-001"
                            className={inputClass(errors.code)}
                        />
                        {errors.code ? (
                            <p className="text-xs text-rose-400">{errors.code}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            País principal
                        </label>
                        <select
                            value={values.primaryCountry}
                            onChange={(e) => setField("primaryCountry", e.target.value)}
                            onBlur={(e) => validateField("primaryCountry", e.target.value)}
                            className={inputClass(errors.primaryCountry)}
                        >
                            <option value="">Selecciona...</option>
                            <option value="CO">Colombia</option>
                            <option value="ES">España</option>
                            <option value="BE">Bélgica</option>
                        </select>
                        {errors.primaryCountry ? (
                            <p className="text-xs text-rose-400">{errors.primaryCountry}</p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Moneda por defecto
                        </label>
                        <select
                            value={values.defaultCurrency}
                            onChange={(e) => setField("defaultCurrency", e.target.value)}
                            onBlur={(e) => validateField("defaultCurrency", e.target.value)}
                            className={inputClass(errors.defaultCurrency)}
                        >
                            <option value="">Selecciona...</option>
                            <option value="COP">COP</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                        {errors.defaultCurrency ? (
                            <p className="text-xs text-rose-400">{errors.defaultCurrency}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Zona horaria
                        </label>
                        <select
                            value={values.defaultTimeZone}
                            onChange={(e) => setField("defaultTimeZone", e.target.value)}
                            onBlur={(e) => validateField("defaultTimeZone", e.target.value)}
                            className={inputClass(errors.defaultTimeZone)}
                        >
                            <option value="">Selecciona...</option>
                            <option value="America/Bogota">America/Bogota</option>
                            <option value="Europe/Madrid">Europe/Madrid</option>
                            <option value="Europe/Brussels">Europe/Brussels</option>
                        </select>
                        {errors.defaultTimeZone ? (
                            <p className="text-xs text-rose-400">{errors.defaultTimeZone}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Locale por defecto
                        </label>
                        <select
                            value={values.defaultLocale}
                            onChange={(e) => setField("defaultLocale", e.target.value)}
                            onBlur={(e) => validateField("defaultLocale", e.target.value)}
                            className={inputClass(errors.defaultLocale)}
                        >
                            <option value="">Selecciona...</option>
                            <option value="es-CO">es-CO</option>
                            <option value="es-ES">es-ES</option>
                            <option value="en-US">en-US</option>
                        </select>
                        {errors.defaultLocale ? (
                            <p className="text-xs text-rose-400">{errors.defaultLocale}</p>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                <div className="flex items-start gap-3">
                    <MdOutlineVerifiedUser size={45} className="text-fuchsia-300"/>
                    <div>
                        <p className="text-sm font-semibold text-slate-100">
                            Confirmación de registro
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                            Al continuar, confirmas que tienes autorización para registrar
                            esta organización y configurar su entorno inicial.
                        </p>
                    </div>
                </div>
            </section>

            <div className="flex items-center justify-end gap-3">
                {/* <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 cursor-pointer"
                >
                    Guardar borrador
                </button> */}
                <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 cursor-pointer"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}