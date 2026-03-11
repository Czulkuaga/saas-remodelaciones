"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoGlobe,
    GoInfo,
    GoLocation,
    // GoNumber,
    GoOrganization,
    GoPerson,
    GoShieldCheck,
    // GoTag,
} from "react-icons/go";
import { LuPaintRoller } from "react-icons/lu";
import { onboardingDraftSchema } from "@/lib/zod/onboarding/onboarding-draft.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { PiArrowCircleUpRightBold } from "react-icons/pi";

function findStepPathBySection(section: string) {
    const map: Record<string, string> = {
        organization: "/onboarding/organization",
        branding: "/onboarding/branding",
        regional: "/onboarding/regional",
        structure: "/onboarding/structure",
        businessPartner: "/onboarding/business-partner",
        adminUser: "/onboarding/admin-user",
        roles: "/onboarding/roles",
        numberRanges: "/onboarding/number-ranges",
    };

    return map[section] ?? "/onboarding/organization";
}

export function ReviewForm() {
    const router = useRouter();
    const { draft, hydrated } = useOnboardingDraft();

    const validation = useMemo(() => onboardingDraftSchema.safeParse(draft), [draft]);
    const issues = validation.success ? [] : validation.error.issues;

    const checklist = [
        {
            key: "organization",
            title: "Organización configurada",
            description: "Identidad del tenant y datos principales.",
            ok: !issues.some((x) => x.path[0] === "organization"),
        },
        {
            key: "branding",
            title: "Branding listo",
            description: "Nombre visible y paleta inicial.",
            ok: !issues.some((x) => x.path[0] === "branding"),
        },
        {
            key: "regional",
            title: "Regional válido",
            description: "País, idioma, timezone y moneda.",
            ok: !issues.some((x) => x.path[0] === "regional"),
        },
        {
            key: "structure",
            title: "Estructura base válida",
            description: "Org unit y location principal.",
            ok: !issues.some((x) => x.path[0] === "structure"),
        },
        {
            key: "businessPartner",
            title: "Business partner completo",
            description: "Entidad principal y datos de contacto.",
            ok: !issues.some((x) => x.path[0] === "businessPartner"),
        },
        {
            key: "adminUser",
            title: "Administrador inicial listo",
            description: "Cuenta principal del tenant.",
            ok: !issues.some((x) => x.path[0] === "adminUser"),
        },
        {
            key: "roles",
            title: "Roles y accesos listos",
            description: "Perfiles de seguridad iniciales.",
            ok: !issues.some((x) => x.path[0] === "roles"),
        },
        {
            key: "numberRanges",
            title: "Numeración inicial válida",
            description: "Rangos de documentos y entidades.",
            ok: !issues.some((x) => x.path[0] === "numberRanges"),
        },
    ];

    const isReady = checklist.every((item) => item.ok);

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando revisión final...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                Resumen del tenant
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Revisión consolidada de la configuración creada durante el onboarding.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                                        <GoOrganization className="text-lg" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-100">
                                        Organización
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.push("/onboarding/organization")}
                                    className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                >
                                    Editar
                                </button>
                            </div>

                            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Nombre legal
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.organization.legalName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Nombre comercial
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.organization.displayName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Slug
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.organization.slug}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Código
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.organization.code}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                                        <LuPaintRoller className="text-lg" />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-100">
                                        Branding
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.push("/onboarding/branding")}
                                    className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                >
                                    Editar
                                </button>
                            </div>

                            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Marca visible
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.branding.brandName || draft.organization.displayName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Color primario
                                    </dt>
                                    <dd className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                                        <span
                                            className="inline-block size-4 rounded-full border border-white/10"
                                            style={{ backgroundColor: draft.branding.primaryColor }}
                                        />
                                        {draft.branding.primaryColor}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GoGlobe className="text-lg text-fuchsia-300" />
                                        <h3 className="text-base font-semibold text-slate-100">
                                            Regional
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/regional")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Editar
                                    </button>
                                </div>

                                <div className="space-y-3 text-sm text-slate-300">
                                    <p>País: {draft.regional.baseCountry}</p>
                                    <p>Idioma: {draft.regional.systemLanguage}</p>
                                    <p>Timezone: {draft.regional.operatingTimeZone}</p>
                                    <p>Moneda: {draft.regional.defaultCurrency}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GoPerson className="text-lg text-fuchsia-300" />
                                        <h3 className="text-base font-semibold text-slate-100">
                                            Administrador inicial
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/admin-user")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Editar
                                    </button>
                                </div>

                                <div className="space-y-3 text-sm text-slate-300">
                                    <p>
                                        {[draft.adminUser.firstName, draft.adminUser.lastName]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </p>
                                    <p>{draft.adminUser.email}</p>
                                    <p>{draft.adminUser.membershipRoleKey}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GoLocation className="text-lg text-fuchsia-300" />
                                    <h3 className="text-base font-semibold text-slate-100">
                                        Estructura y business partner
                                    </h3>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/structure")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Estructura
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/business-partner")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Partner
                                    </button>
                                </div>
                            </div>

                            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Org Unit
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.structure.orgUnitName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Location
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.structure.locationName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Business Partner
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.businessPartner.legalName}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Identificador
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-200">
                                        {draft.businessPartner.identifierType} {draft.businessPartner.identifierValue}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GoShieldCheck className="text-lg text-fuchsia-300" />
                                    <h3 className="text-base font-semibold text-slate-100">
                                        Roles y numeración
                                    </h3>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/roles")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Roles
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/onboarding/number-ranges")}
                                        className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200 cursor-pointer"
                                    >
                                        Numeración
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Roles activos
                                    </p>
                                    <ul className="mt-2 space-y-2 text-sm text-slate-200">
                                        {draft.roles.roles.map((role) => (
                                            <li key={role.key}>
                                                {role.name} ({role.permissions.length} permisos)
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Number ranges
                                    </p>
                                    <ul className="mt-2 space-y-2 text-sm text-slate-200">
                                        {draft.numberRanges.ranges.slice(0, 4).map((range) => (
                                            <li key={range.entity}>
                                                {range.prefix}-{String(range.startNumber).padStart(range.padding, "0")}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
                    <h3 className="text-lg font-semibold text-slate-100">
                        Checklist de readiness
                    </h3>

                    <div className="mt-6 space-y-4">
                        {checklist.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => router.push(findStepPathBySection(item.key))}
                                className="flex w-full items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-slate-700 cursor-pointer"
                            >
                                <div
                                    className={[
                                        "mt-0.5 flex size-6 items-center justify-center rounded-full",
                                        item.ok
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-rose-500/15 text-rose-400",
                                    ].join(" ")}
                                >
                                    <GoCheckCircle className="text-sm" />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-slate-200">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {item.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        disabled={!isReady}
                        onClick={() => router.push("/onboarding/provisioning")}
                        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                        Provisionar entorno
                        <PiArrowCircleUpRightBold size={18}/>
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                        {isReady
                            ? "Todo está listo para iniciar la provisión del tenant."
                            : "Hay secciones pendientes o inválidas. Revísalas antes de continuar."}
                    </p>
                </section>

                {/* <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-start gap-3">
                        <GoInfo className="mt-0.5 text-fuchsia-300" />
                        <p className="text-sm leading-6 text-slate-400">
                            La provisión real del entorno vendrá después, cuando conectemos el backend
                            y ejecutemos la creación del tenant, sus catálogos y relaciones base.
                        </p>
                    </div>
                </section> */}
            </aside>
        </div>
    );
}