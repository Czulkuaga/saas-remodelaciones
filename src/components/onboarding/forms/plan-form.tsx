"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoCheckCircle, GoCreditCard, GoInfo, GoRocket } from "react-icons/go";
import { planSchema, type PlanFormValues } from "@/lib/zod/onboarding/plan.schema";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import {
    PLAN_CONFIG,
    buildSubscriptionPreview,
    type PlanCode,
} from "@/components/onboarding/plan-config";
import { FaArrowRight } from "react-icons/fa";

type FormErrors = Partial<Record<keyof PlanFormValues, string>>;

function formatMoney(cents: number, currencyCode: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
    }).format(cents / 100);
}

const PLAN_DESCRIPTIONS: Record<PlanCode, string> = {
    TRIAL: "Ideal para prueba inicial del tenant.",
    PROFESSIONAL: "Para equipos operativos pequeños y medianos.",
    ENTERPRISE: "Para organizaciones con operación más robusta."
};

export function PlanForm() {
    const router = useRouter();
    const { draft, hydrated, updateDraft } = useOnboardingDraft();
    const [errors, setErrors] = useState<FormErrors>({});

    const values = useMemo<PlanFormValues>(
        () => ({
            planCode: draft.plan.planCode,
            couponCode: draft.plan.couponCode,
            subscriptionPreview: draft.plan.subscriptionPreview,
        }),
        [draft.plan]
    );

    if (!hydrated) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Cargando formulario...
            </div>
        );
    }

    function setPlan(planCode: PlanCode) {
        updateDraft((prev) => ({
            ...prev,
            plan: {
                ...prev.plan,
                planCode,
                subscriptionPreview: buildSubscriptionPreview(planCode, {
                    couponCode: prev.plan.couponCode,
                    couponStatus: "idle",
                    couponMessage: "",
                }),
            },
        }));

        setErrors({});
    }

    function setCouponCode(couponCode: string) {
        updateDraft((prev) => ({
            ...prev,
            plan: {
                ...prev.plan,
                couponCode,
            },
        }));
    }

    function applyCoupon() {
        updateDraft((prev) => {
            const code = prev.plan.couponCode.trim().toUpperCase();
            const planCode = prev.plan.planCode;

            if (!code) {
                return {
                    ...prev,
                    plan: {
                        ...prev.plan,
                        subscriptionPreview: buildSubscriptionPreview(planCode, {
                            couponCode: "",
                            couponStatus: "invalid",
                            couponMessage: "Debes ingresar un cupón.",
                        }),
                    },
                };
            }

            if (code === "BETA90") {
                return {
                    ...prev,
                    plan: {
                        ...prev.plan,
                        couponCode: code,
                        trialDays:90,
                        subscriptionPreview: buildSubscriptionPreview(planCode, {
                            couponCode: code,
                            couponStatus: "valid",
                            couponMessage: "Cupón beta aplicado correctamente.",
                            percentOff: 100,
                            isBeta: true,
                        }),
                    },
                };
            }

            if (code === "BETA50") {
                return {
                    ...prev,
                    plan: {
                        ...prev.plan,
                        couponCode: code,
                        subscriptionPreview: buildSubscriptionPreview(planCode, {
                            couponCode: code,
                            couponStatus: "valid",
                            couponMessage: "Cupón aplicado: 50% de descuento.",
                            percentOff: 50,
                        }),
                    },
                };
            }

            return {
                ...prev,
                plan: {
                    ...prev.plan,
                    subscriptionPreview: buildSubscriptionPreview(planCode, {
                        couponCode: code,
                        couponStatus: "invalid",
                        couponMessage: "El cupón no es válido.",
                    }),
                },
            };
        });
    }

    function validateForm() {
        const result = planSchema.safeParse(values);
        if (result.success) {
            setErrors({});
            return true;
        }

        const nextErrors: FormErrors = {};
        for (const issue of result.error.issues) {
            const field = issue.path[0] as keyof PlanFormValues;
            if (!nextErrors[field]) nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
        return false;
    }

    function handleContinue() {
        if (!validateForm()) return;
        router.push("/onboarding/review");
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">Selecciona un plan</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Define el plan con el que se creará la suscripción inicial del tenant.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {(Object.keys(PLAN_CONFIG) as PlanCode[]).map((planCode) => {
                            const active = values.planCode === planCode;
                            const config = PLAN_CONFIG[planCode];

                            return (
                                <button
                                    key={planCode}
                                    type="button"
                                    onClick={() => setPlan(planCode)}
                                    className={[
                                        "rounded-2xl border p-5 text-left transition",
                                        active
                                            ? "border-fuchsia-500/30 bg-fuchsia-500/10"
                                            : "border-slate-800 bg-slate-950/70 hover:border-slate-700",
                                    ].join(" ")}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                                            <GoRocket className="text-lg" />
                                        </div>
                                        {active ? (
                                            <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                                Activo
                                            </span>
                                        ) : null}
                                    </div>

                                    <p className="text-sm font-semibold text-slate-100">{planCode}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        {PLAN_DESCRIPTIONS[planCode]}
                                    </p>

                                    <div className="mt-4 text-sm text-slate-300">
                                        {config.billingInterval === "LIFETIME"
                                            ? "Lifetime"
                                            : formatMoney(config.basePriceCents, config.currencyCode)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                            <GoCreditCard className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">Cupón promocional</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Puedes aplicar un cupón si existe una campaña activa o beta.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                        <input
                            value={values.couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Ej. BETA100"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-fuchsia-500/40"
                        />

                        <button
                            type="button"
                            onClick={applyCoupon}
                            className="rounded-xl bg-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                        >
                            Aplicar cupón
                        </button>
                    </div>

                    {values.subscriptionPreview.couponMessage ? (
                        <p
                            className={[
                                "mt-3 text-sm",
                                values.subscriptionPreview.couponStatus === "valid"
                                    ? "text-emerald-400"
                                    : "text-rose-400",
                            ].join(" ")}
                        >
                            {values.subscriptionPreview.couponMessage}
                        </p>
                    ) : null}
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/number-ranges")}
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
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-2xl">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Resumen de suscripción
                    </h3>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-sm font-medium text-slate-100">{values.planCode}</p>
                        <p className="mt-2 text-2xl font-bold text-fuchsia-300">
                            {values.subscriptionPreview.billingInterval === "LIFETIME"
                                ? "Custom"
                                : formatMoney(
                                    values.subscriptionPreview.finalPriceCents,
                                    values.subscriptionPreview.currencyCode
                                )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {values.subscriptionPreview.billingInterval}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Usuarios</dt>
                                <dd className="text-right text-slate-200">
                                    {values.subscriptionPreview.maxUsers ?? "Ilimitados"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Proyectos</dt>
                                <dd className="text-right text-slate-200">
                                    {values.subscriptionPreview.maxProjects ?? "Ilimitados"}
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Trial</dt>
                                <dd className="text-right text-slate-200">
                                    {values.subscriptionPreview.trialDays} días
                                </dd>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-slate-500">Cupón</dt>
                                <dd className="text-right text-slate-200">
                                    {values.subscriptionPreview.appliedCouponCode || "-"}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <GoCheckCircle className="text-lg" />
                            <p className="text-sm font-medium">Plan válido para continuar</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            La suscripción inicial está lista para ser consolidada en el provisioning final.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-start gap-3">
                            <GoInfo className="mt-0.5 text-slate-500" />
                            <p className="text-xs leading-5 text-slate-400">
                                Más adelante podrás reemplazar esta lógica por integración real con billing,
                                Stripe, trial extendido o campañas beta.
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}