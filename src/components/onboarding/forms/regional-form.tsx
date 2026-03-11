"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoCheckCircle, GoGlobe, GoClock, GoCreditCard } from "react-icons/go";
import {
    regionalSchema,
    type RegionalFormValues,
} from "@/lib/zod/onboarding/regional.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";

type FormErrors = Partial<Record<keyof RegionalFormValues, string>>;

const COUNTRY_DEFAULTS: Record<
    string,
    Pick<
        RegionalFormValues,
        "systemLanguage" | "operatingTimeZone" | "defaultCurrency" | "dateFormat" | "weekStartsOn"
    >
> = {
    CO: {
        systemLanguage: "es-CO",
        operatingTimeZone: "America/Bogota",
        defaultCurrency: "COP",
        dateFormat: "DD/MM/YYYY",
        weekStartsOn: "MONDAY",
    },
    ES: {
        systemLanguage: "es-ES",
        operatingTimeZone: "Europe/Madrid",
        defaultCurrency: "EUR",
        dateFormat: "DD/MM/YYYY",
        weekStartsOn: "MONDAY",
    },
    BE: {
        systemLanguage: "fr-BE",
        operatingTimeZone: "Europe/Brussels",
        defaultCurrency: "EUR",
        dateFormat: "DD/MM/YYYY",
        weekStartsOn: "MONDAY",
    },
    US: {
        systemLanguage: "en-US",
        operatingTimeZone: "America/New_York",
        defaultCurrency: "USD",
        dateFormat: "MM/DD/YYYY",
        weekStartsOn: "SUNDAY",
    },
};

function currencyPreview(currency: string) {
    switch (currency) {
        case "COP":
            return "$ 12.450,00 COP";
        case "EUR":
            return "€ 12.450,00 EUR";
        case "USD":
            return "$12,450.00 USD";
        default:
            return "12,450.00";
    }
}

function datePreview(format: string) {
    switch (format) {
        case "MM/DD/YYYY":
            return "10/24/2026";
        case "YYYY-MM-DD":
            return "2026-10-24";
        default:
            return "24/10/2026";
    }
}

function timeZoneShortLabel(tz: string) {
    if (tz === "America/Bogota") return "COT";
    if (tz === "Europe/Madrid") return "CET";
    if (tz === "Europe/Brussels") return "CET";
    if (tz === "America/New_York") return "EST";
    return "UTC";
}

export function RegionalForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<RegionalFormValues>(
        () => ({
            baseCountry: draft.regional.baseCountry,
            systemLanguage: draft.regional.systemLanguage,
            operatingTimeZone: draft.regional.operatingTimeZone,
            defaultCurrency: draft.regional.defaultCurrency,
            dateFormat: draft.regional.dateFormat,
            weekStartsOn: draft.regional.weekStartsOn,
        }),
        [draft.regional]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof RegionalFormValues>(
        field: K,
        value: RegionalFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            regional: {
                ...prev.regional,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof RegionalFormValues>(
        field: K,
        value: RegionalFormValues[K]
    ) {
        const result = regionalSchema.shape[field].safeParse(value);

        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0]?.message,
        }));
    }

    function validateForm() {
        const result = regionalSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof RegionalFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/structure");
    }

    function handleApplyCountryDefaults(countryCode: string) {
        const defaults = COUNTRY_DEFAULTS[countryCode];
        if (!defaults) return;

        updateDraft((prev) => ({
            ...prev,
            regional: {
                ...prev.regional,
                baseCountry: countryCode,
                ...defaults,
            },
        }));

        setErrors({});
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    const activeDefaults = COUNTRY_DEFAULTS[values.baseCountry];

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Localización principal
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Configura país base, idioma, zona horaria, moneda y formato general.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                País base
                            </label>
                            <select
                                value={values.baseCountry}
                                onChange={(e) => handleApplyCountryDefaults(e.target.value)}
                                onBlur={(e) => validateField("baseCountry", e.target.value)}
                                className={inputClass(errors.baseCountry)}
                            >
                                <option value="">Selecciona...</option>
                                <option value="CO">Colombia</option>
                                <option value="ES">España</option>
                                <option value="BE">Bélgica</option>
                                <option value="US">Estados Unidos</option>
                            </select>
                            {errors.baseCountry ? (
                                <p className="text-xs text-rose-400">{errors.baseCountry}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Idioma del sistema
                            </label>
                            <select
                                value={values.systemLanguage}
                                onChange={(e) => setField("systemLanguage", e.target.value)}
                                onBlur={(e) => validateField("systemLanguage", e.target.value)}
                                className={inputClass(errors.systemLanguage)}
                            >
                                <option value="">Selecciona...</option>
                                <option value="es-CO">Español (Colombia)</option>
                                <option value="es-ES">Español (España)</option>
                                <option value="fr-BE">Francés (Bélgica)</option>
                                <option value="en-US">English (US)</option>
                            </select>
                            {errors.systemLanguage ? (
                                <p className="text-xs text-rose-400">{errors.systemLanguage}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Zona horaria operativa
                            </label>
                            <select
                                value={values.operatingTimeZone}
                                onChange={(e) => setField("operatingTimeZone", e.target.value)}
                                onBlur={(e) =>
                                    validateField("operatingTimeZone", e.target.value)
                                }
                                className={inputClass(errors.operatingTimeZone)}
                            >
                                <option value="">Selecciona...</option>
                                <option value="America/Bogota">America/Bogota</option>
                                <option value="Europe/Madrid">Europe/Madrid</option>
                                <option value="Europe/Brussels">Europe/Brussels</option>
                                <option value="America/New_York">America/New_York</option>
                            </select>
                            {errors.operatingTimeZone ? (
                                <p className="text-xs text-rose-400">
                                    {errors.operatingTimeZone}
                                </p>
                            ) : null}
                        </div>

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
                                Formato de fecha
                            </label>
                            <select
                                value={values.dateFormat}
                                onChange={(e) => setField("dateFormat", e.target.value)}
                                onBlur={(e) => validateField("dateFormat", e.target.value)}
                                className={inputClass(errors.dateFormat)}
                            >
                                <option value="">Selecciona...</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                            {errors.dateFormat ? (
                                <p className="text-xs text-rose-400">{errors.dateFormat}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Inicio de semana
                            </label>
                            <select
                                value={values.weekStartsOn}
                                onChange={(e) =>
                                    setField("weekStartsOn", e.target.value as "SUNDAY" | "MONDAY")
                                }
                                onBlur={(e) =>
                                    validateField(
                                        "weekStartsOn",
                                        e.target.value as "SUNDAY" | "MONDAY"
                                    )
                                }
                                className={inputClass(errors.weekStartsOn)}
                            >
                                <option value="MONDAY">Lunes</option>
                                <option value="SUNDAY">Domingo</option>
                            </select>
                            {errors.weekStartsOn ? (
                                <p className="text-xs text-rose-400">{errors.weekStartsOn}</p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <MdAutoAwesome />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                                Defaults inteligentes aplicados
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                Basado en el país seleccionado, sugerimos configuración regional
                                inicial para dejar el tenant listo desde el primer acceso.
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                                    Semana laboral: lunes a viernes
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                                    Inicio de semana: {values.weekStartsOn === "MONDAY" ? "lunes" : "domingo"}
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                                    Formato fecha: {values.dateFormat}
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                                    Timezone: {values.operatingTimeZone}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/branding")}
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
                        <FaArrowRight size={18} />
                    </button>
                </div>
            </div>

            <aside className="xl:sticky xl:top-24 xl:h-fit">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Vista previa de formato
                    </h3>

                    <div className="mt-6 space-y-6">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-slate-400">
                                <GoCreditCard className="text-sm" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Moneda
                                </span>
                            </div>
                            <p className="text-2xl font-bold tracking-tight text-fuchsia-300">
                                {currencyPreview(values.defaultCurrency)}
                            </p>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-400">
                                <GoClock className="text-sm" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Fecha y hora
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-100">
                                {datePreview(values.dateFormat)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-100">
                                03:45 PM{" "}
                                <span className="text-xs font-normal text-slate-500">
                                    {timeZoneShortLabel(values.operatingTimeZone)}
                                </span>
                            </p>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-400">
                                <GoGlobe className="text-sm" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Grandes números
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-100">
                                {values.dateFormat === "MM/DD/YYYY" ? "1,000,000.00" : "1.000.000,00"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <GoCheckCircle className="text-lg" />
                                <p className="text-sm font-medium">Chequeo inicial correcto</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                                La configuración regional actual es consistente para un arranque
                                operativo del tenant.
                            </p>
                        </div>

                        {activeDefaults ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Defaults del país
                                </p>
                                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                                    <li>Idioma sugerido: {activeDefaults.systemLanguage}</li>
                                    <li>Moneda sugerida: {activeDefaults.defaultCurrency}</li>
                                    <li>Fecha sugerida: {activeDefaults.dateFormat}</li>
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>
            </aside>
        </div>
    );
}