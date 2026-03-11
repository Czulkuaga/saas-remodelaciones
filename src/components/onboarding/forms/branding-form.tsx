"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoImage, GoTag, GoCheckCircle } from "react-icons/go";
import { LuPaintRoller } from "react-icons/lu";
import {
    brandingSchema,
    type BrandingFormValues,
} from "@/lib/zod/onboarding/branding.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = Partial<Record<keyof BrandingFormValues, string>>;

function isValidHex(value: string) {
    return /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

function normalizeHex(value: string) {
    if (!value.startsWith("#")) return `#${value}`;
    return value;
}

export function BrandingForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<BrandingFormValues>(
        () => ({
            brandName: draft.branding.brandName,
            logoDarkUrl: draft.branding.logoDarkUrl,
            logoLightUrl: draft.branding.logoLightUrl,
            logoIconUrl: draft.branding.logoIconUrl,
            primaryColor: draft.branding.primaryColor,
            secondaryColor: draft.branding.secondaryColor,
            useDefaultBranding: draft.branding.useDefaultBranding,
        }),
        [draft.branding]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setField<K extends keyof BrandingFormValues>(
        field: K,
        value: BrandingFormValues[K]
    ) {
        updateDraft((prev) => ({
            ...prev,
            branding: {
                ...prev.branding,
                [field]: value,
            },
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    }

    function validateField<K extends keyof BrandingFormValues>(
        field: K,
        value: BrandingFormValues[K]
    ) {
        const result = brandingSchema.shape[field].safeParse(value);

        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0]?.message,
        }));
    }

    function validateForm() {
        const result = brandingSchema.safeParse(values);

        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};

        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof BrandingFormValues;
            if (!nextErrors[field]) {
                nextErrors[field] = issue.message;
            }
        }

        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/regional");
    }

    function handleUseDefaults(checked: boolean) {
        setField("useDefaultBranding", checked);

        if (checked) {
            updateDraft((prev) => ({
                ...prev,
                branding: {
                    ...prev.branding,
                    primaryColor: "#D946EF",
                    secondaryColor: "#0F172A",
                },
            }));
        }
    }

    const inputClass = (hasError?: string) =>
        [
            "w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500",
            hasError
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-fuchsia-500/40",
        ].join(" ");

    const uploadCardClass =
        "group rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-5 transition hover:border-fuchsia-500/40 hover:bg-slate-900";

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Identidad visual
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Define el nombre visible de la marca y los colores base del workspace.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nombre visible de la marca
                            </label>
                            <input
                                value={values.brandName}
                                onChange={(e) => setField("brandName", e.target.value)}
                                onBlur={(e) => validateField("brandName", e.target.value)}
                                placeholder="Ej. Esmeralda Remodeling"
                                className={inputClass(errors.brandName)}
                            />
                            {errors.brandName ? (
                                <p className="text-xs text-rose-400">{errors.brandName}</p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Este nombre podrá mostrarse en login, sidebar y encabezados del tenant.
                                </p>
                            )}
                        </div>

                        <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <input
                                type="checkbox"
                                checked={values.useDefaultBranding}
                                onChange={(e) => handleUseDefaults(e.target.checked)}
                                className="mt-1 size-4 rounded border-slate-700 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500"
                            />
                            <div>
                                <p className="text-sm font-medium text-slate-200">
                                    Usar branding por defecto
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                    Ideal para iniciar rápido. Luego podrás personalizarlo con más detalle.
                                </p>
                            </div>
                        </label>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Recursos de logo
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Por ahora puedes guardar referencias o URLs temporales. Luego conectamos subida real.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className={uploadCardClass}>
                            <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
                                {values.logoDarkUrl ? (
                                    <img
                                        src={values.logoDarkUrl}
                                        alt="Logo dark"
                                        className="h-full w-full rounded-2xl object-contain p-4"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <GoImage className="mx-auto text-3xl text-slate-500 transition group-hover:text-fuchsia-300" />
                                        <p className="mt-2 text-xs text-slate-500">Dark logo</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold text-slate-100">
                                    Logo dark mode
                                </p>
                                <input
                                    value={values.logoDarkUrl ?? ""}
                                    onChange={(e) => setField("logoDarkUrl", e.target.value)}
                                    onBlur={(e) => validateField("logoDarkUrl", e.target.value)}
                                    placeholder="URL o referencia"
                                    className={inputClass(errors.logoDarkUrl)}
                                />
                                {errors.logoDarkUrl ? (
                                    <p className="text-xs text-rose-400">{errors.logoDarkUrl}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">PNG, SVG o referencia temporal</p>
                                )}
                            </div>
                        </div>

                        <div className={uploadCardClass}>
                            <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-800 bg-white/5">
                                {values.logoLightUrl ? (
                                    <img
                                        src={values.logoLightUrl}
                                        alt="Logo light"
                                        className="h-full w-full rounded-2xl object-contain p-4"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <GoImage className="mx-auto text-3xl text-slate-500 transition group-hover:text-fuchsia-300" />
                                        <p className="mt-2 text-xs text-slate-500">Light logo</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold text-slate-100">
                                    Logo light mode
                                </p>
                                <input
                                    value={values.logoLightUrl ?? ""}
                                    onChange={(e) => setField("logoLightUrl", e.target.value)}
                                    onBlur={(e) => validateField("logoLightUrl", e.target.value)}
                                    placeholder="URL o referencia"
                                    className={inputClass(errors.logoLightUrl)}
                                />
                                {errors.logoLightUrl ? (
                                    <p className="text-xs text-rose-400">{errors.logoLightUrl}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">Útil para fondos claros</p>
                                )}
                            </div>
                        </div>

                        <div className={uploadCardClass}>
                            <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
                                {values.logoIconUrl ? (
                                    <img
                                        src={values.logoIconUrl}
                                        alt="Isotipo"
                                        className="h-full w-full rounded-2xl object-contain p-4"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <GoTag className="mx-auto text-3xl text-slate-500 transition group-hover:text-fuchsia-300" />
                                        <p className="mt-2 text-xs text-slate-500">Isotipo</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold text-slate-100">Isotipo</p>
                                <input
                                    value={values.logoIconUrl ?? ""}
                                    onChange={(e) => setField("logoIconUrl", e.target.value)}
                                    onBlur={(e) => validateField("logoIconUrl", e.target.value)}
                                    placeholder="URL o referencia"
                                    className={inputClass(errors.logoIconUrl)}
                                />
                                {errors.logoIconUrl ? (
                                    <p className="text-xs text-rose-400">{errors.logoIconUrl}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">Icono cuadrado de marca</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">
                            Paleta principal
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Estos colores se usarán en botones, destacados, links y acentos del tenant.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-12 rounded-xl border border-white/10 ring-4 ring-white/5"
                                    style={{ backgroundColor: values.primaryColor }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-100">
                                        Color primario
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Acciones principales y estados activos
                                    </p>
                                </div>
                                <LuPaintRoller className="text-lg text-slate-400" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <input
                                    value={values.primaryColor}
                                    onChange={(e) =>
                                        setField("primaryColor", normalizeHex(e.target.value))
                                    }
                                    onBlur={(e) =>
                                        validateField("primaryColor", normalizeHex(e.target.value))
                                    }
                                    placeholder="#D946EF"
                                    disabled={values.useDefaultBranding}
                                    className={inputClass(errors.primaryColor)}
                                />
                                {errors.primaryColor ? (
                                    <p className="text-xs text-rose-400">{errors.primaryColor}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        Formato esperado: #D946EF
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-12 rounded-xl border border-white/10 ring-4 ring-white/5"
                                    style={{ backgroundColor: values.secondaryColor }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-100">
                                        Color secundario
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Soporte visual y contraste complementario
                                    </p>
                                </div>
                                <LuPaintRoller className="text-lg text-slate-400" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <input
                                    value={values.secondaryColor}
                                    onChange={(e) =>
                                        setField("secondaryColor", normalizeHex(e.target.value))
                                    }
                                    onBlur={(e) =>
                                        validateField("secondaryColor", normalizeHex(e.target.value))
                                    }
                                    placeholder="#0F172A"
                                    disabled={values.useDefaultBranding}
                                    className={inputClass(errors.secondaryColor)}
                                />
                                {errors.secondaryColor ? (
                                    <p className="text-xs text-rose-400">{errors.secondaryColor}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        Recomendado un tono oscuro neutro o complementario
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {!values.useDefaultBranding &&
                        isValidHex(values.primaryColor) &&
                        isValidHex(values.secondaryColor) ? (
                        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <GoCheckCircle />
                                <p className="text-sm font-medium">
                                    Paleta lista para vista previa
                                </p>
                            </div>
                        </div>
                    ) : null}
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/organization")}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200 cursor-pointer"
                    >
                        Atrás
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/regional")}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 cursor-pointer"
                    >
                        Omitir por ahora
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
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-rose-400/70" />
                            <div className="size-2 rounded-full bg-yellow-400/70" />
                            <div className="size-2 rounded-full bg-emerald-400/70" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Live preview
                        </span>
                    </div>

                    <div className="flex min-h-115">
                        <div className="flex w-16 flex-col items-center gap-4 border-r border-slate-800 bg-slate-950 py-4">
                            <div
                                className="size-9 rounded-xl"
                                style={{ backgroundColor: values.primaryColor }}
                            />
                            <div className="mt-4 flex flex-col gap-2 opacity-60">
                                <div className="size-6 rounded-md bg-slate-700" />
                                <div className="size-6 rounded-md bg-slate-700" />
                                <div
                                    className="size-6 rounded-md border"
                                    style={{
                                        backgroundColor: `${values.primaryColor}55`,
                                        borderColor: `${values.primaryColor}88`,
                                    }}
                                />
                                <div className="size-6 rounded-md bg-slate-700" />
                            </div>
                        </div>

                        <div
                            className="flex flex-1 flex-col items-center justify-center gap-6 p-6"
                            style={{ backgroundColor: `${values.secondaryColor}22` }}
                        >
                            <div className="w-full max-w-52.5 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner">
                                <div className="mb-4 h-2 w-1/2 rounded bg-slate-700" />
                                <button
                                    type="button"
                                    className="flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold uppercase tracking-[0.18em] text-white"
                                    style={{ backgroundColor: values.primaryColor }}
                                >
                                    Login
                                </button>
                                <div className="mx-auto mt-4 h-2 w-3/4 rounded bg-slate-800" />
                            </div>

                            <div className="text-center">
                                <p className="text-xs font-semibold text-slate-200">
                                    {values.brandName || draft.organization.displayName || "Tu marca"}
                                </p>
                                <p className="mt-2 max-w-55 text-xs leading-5 text-slate-400">
                                    El sistema utilizará el color primario para los elementos
                                    interactivos y acentos de navegación.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 px-5 py-4 text-center">
                        <p className="text-xs italic text-slate-500">
                            Los cambios se reflejan visualmente en tiempo real
                        </p>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <GoCheckCircle className="text-lg" />
                        <p className="text-sm font-medium">Contraste visual aceptable</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Esta validación es visual inicial. Más adelante podrás agregar controles
                        avanzados de accesibilidad y contraste.
                    </p>
                </div>
            </aside>
        </div>
    );
}