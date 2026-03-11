"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoLocation,
    GoOrganization,
    GoInfo,
} from "react-icons/go";
import {
    structureSchema,
    type StructureFormValues,
} from "@/lib/zod/onboarding/structure.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = Partial<Record<keyof StructureFormValues, string>>;

const COUNTRY_TIMEZONE_DEFAULTS: Record<string, string> = {
    CO: "America/Bogota",
    ES: "Europe/Madrid",
    BE: "Europe/Brussels",
    US: "America/New_York",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
    HEADQUARTERS: "Sede principal",
    BRANCH: "Sucursal",
    WAREHOUSE: "Centro logístico",
    OPERATIONS: "Centro de operaciones",
};

export function StructureForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<StructureFormValues>(
        () => ({
            orgUnitName: draft.structure.orgUnitName,
            orgUnitType: draft.structure.orgUnitType,
            locationName: draft.structure.locationName,
            addressLine1: draft.structure.addressLine1,
            city: draft.structure.city,
            postalCode: draft.structure.postalCode,
            countryCode: draft.structure.countryCode,
            timeZone: draft.structure.timeZone,
        }),
        [draft.structure]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof StructureFormValues>(
        field: K,
        value: StructureFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            structure: {
                ...prev.structure,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof StructureFormValues>(
        field: K,
        value: StructureFormValues[K]
    ) {
        const result = structureSchema.shape[field].safeParse(value);

        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0]?.message,
        }));
    }

    function validateForm() {
        const result = structureSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof StructureFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/business-partner");
    }

    function handleCountryChange(countryCode: string) {
        updateDraft((prev) => ({
            ...prev,
            structure: {
                ...prev.structure,
                countryCode,
                timeZone:
                    COUNTRY_TIMEZONE_DEFAULTS[countryCode] ?? prev.structure.timeZone,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            countryCode: undefined,
            timeZone: undefined,
        }));
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    const previewUnitTypeLabel =
        UNIT_TYPE_LABELS[values.orgUnitType] ?? "Unidad principal";

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Unidad organizacional principal
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Define la unidad base desde la cual inicia la organización dentro de la plataforma.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre de la unidad
                            </label>
                            <input
                                value={values.orgUnitName}
                                onChange={(e) => setField("orgUnitName", e.target.value)}
                                onBlur={(e) => validateField("orgUnitName", e.target.value)}
                                placeholder="Ej. Sede principal"
                                className={inputClass(errors.orgUnitName)}
                            />
                            {errors.orgUnitName ? (
                                <p className="text-xs text-rose-400">{errors.orgUnitName}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Tipo de unidad
                            </label>
                            <select
                                value={values.orgUnitType}
                                onChange={(e) => setField("orgUnitType", e.target.value)}
                                onBlur={(e) => validateField("orgUnitType", e.target.value)}
                                className={inputClass(errors.orgUnitType)}
                            >
                                <option value="">Selecciona...</option>
                                <option value="HEADQUARTERS">Sede principal</option>
                                <option value="BRANCH">Sucursal</option>
                                <option value="WAREHOUSE">Centro logístico</option>
                                <option value="OPERATIONS">Centro de operaciones</option>
                            </select>
                            {errors.orgUnitType ? (
                                <p className="text-xs text-rose-400">{errors.orgUnitType}</p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Ubicación principal
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Configura la primera ubicación física u operativa asociada a la unidad principal.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre de la ubicación
                            </label>
                            <input
                                value={values.locationName}
                                onChange={(e) => setField("locationName", e.target.value)}
                                onBlur={(e) => validateField("locationName", e.target.value)}
                                placeholder="Ej. Oficina Medellín"
                                className={inputClass(errors.locationName)}
                            />
                            {errors.locationName ? (
                                <p className="text-xs text-rose-400">{errors.locationName}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Dirección principal
                            </label>
                            <input
                                value={values.addressLine1}
                                onChange={(e) => setField("addressLine1", e.target.value)}
                                onBlur={(e) => validateField("addressLine1", e.target.value)}
                                placeholder="Ej. Calle 10 # 42-45"
                                className={inputClass(errors.addressLine1)}
                            />
                            {errors.addressLine1 ? (
                                <p className="text-xs text-rose-400">{errors.addressLine1}</p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Luego podrás conectar autocompletado y georreferenciación real.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Ciudad
                                </label>
                                <input
                                    value={values.city}
                                    onChange={(e) => setField("city", e.target.value)}
                                    onBlur={(e) => validateField("city", e.target.value)}
                                    placeholder="Ej. Medellín"
                                    className={inputClass(errors.city)}
                                />
                                {errors.city ? (
                                    <p className="text-xs text-rose-400">{errors.city}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Código postal
                                </label>
                                <input
                                    value={values.postalCode}
                                    onChange={(e) => setField("postalCode", e.target.value)}
                                    onBlur={(e) => validateField("postalCode", e.target.value)}
                                    placeholder="Ej. 050021"
                                    className={inputClass(errors.postalCode)}
                                />
                                {errors.postalCode ? (
                                    <p className="text-xs text-rose-400">{errors.postalCode}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    País
                                </label>
                                <select
                                    value={values.countryCode}
                                    onChange={(e) => handleCountryChange(e.target.value)}
                                    onBlur={(e) => validateField("countryCode", e.target.value)}
                                    className={inputClass(errors.countryCode)}
                                >
                                    <option value="">Selecciona...</option>
                                    <option value="CO">Colombia</option>
                                    <option value="ES">España</option>
                                    <option value="BE">Bélgica</option>
                                    <option value="US">Estados Unidos</option>
                                </select>
                                {errors.countryCode ? (
                                    <p className="text-xs text-rose-400">{errors.countryCode}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Zona horaria
                                </label>
                                <select
                                    value={values.timeZone}
                                    onChange={(e) => setField("timeZone", e.target.value)}
                                    onBlur={(e) => validateField("timeZone", e.target.value)}
                                    className={inputClass(errors.timeZone)}
                                >
                                    <option value="">Selecciona...</option>
                                    <option value="America/Bogota">America/Bogota</option>
                                    <option value="Europe/Madrid">Europe/Madrid</option>
                                    <option value="Europe/Brussels">Europe/Brussels</option>
                                    <option value="America/New_York">America/New_York</option>
                                </select>
                                {errors.timeZone ? (
                                    <p className="text-xs text-rose-400">{errors.timeZone}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/regional")}
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
                        <FaArrowRight size={18} />
                    </button>
                </div>
            </div>

            <aside className="xl:sticky xl:top-24 xl:h-fit">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4 shadow-2xl">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Vista previa
                        </span>
                        <span className="flex size-2 rounded-full bg-emerald-400" />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-800">
                        <div className="relative aspect-square bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.10),rgba(15,23,42,0.85)_60%)]">
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute -inset-4 rounded-full bg-fuchsia-500/20 blur-xl" />
                                    <GoLocation className="relative text-5xl text-fuchsia-300" />
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Unidad seleccionada
                                </p>
                                <p className="mt-1 text-sm font-medium text-white">
                                    {values.orgUnitName || "Sede principal"} ({previewUnitTypeLabel})
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    {values.locationName || "Ubicación principal"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <GoInfo className="text-sm" />
                            <p className="text-xs italic">
                                Más adelante podrás asociar más ubicaciones, sedes y unidades.
                            </p>
                        </div>
                    </div> */}

                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <GoCheckCircle className="text-lg" />
                            <p className="text-sm font-medium">Estructura base válida</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            Esta configuración es suficiente para iniciar la provisión de la estructura
                            organizacional del tenant.
                        </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="mb-3 flex items-center gap-2 text-slate-300">
                            <GoOrganization className="text-lg" />
                            <p className="text-sm font-medium">Resumen</p>
                        </div>

                        <dl className="space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Unidad</dt>
                                <dd className="text-right text-slate-200">
                                    {values.orgUnitName || "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Tipo</dt>
                                <dd className="text-right text-slate-200">
                                    {previewUnitTypeLabel}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Ciudad</dt>
                                <dd className="text-right text-slate-200">
                                    {values.city || "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">País</dt>
                                <dd className="text-right text-slate-200">
                                    {values.countryCode || "-"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Timezone</dt>
                                <dd className="max-w-35 text-right text-slate-200 wrap-break-word">
                                    {values.timeZone || "-"}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </aside>
        </div>
    );
}