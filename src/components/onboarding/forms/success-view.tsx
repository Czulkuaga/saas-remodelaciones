"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoGlobe,
    GoMail,
    GoShieldCheck,
} from "react-icons/go";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";
import { FaArrowRight } from "react-icons/fa";
import { IoIosHelpCircleOutline } from "react-icons/io";

export function SuccessView() {
    const router = useRouter();
    const { draft, hydrated, resetDraft } = useOnboardingDraft();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState("");

    if (!hydrated) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
                Cargando resultado final...
            </main>
        );
    }

    const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "remodelaciones.app";

    const tenantSlug = draft.organization.slug || "";
    const tenantName =
        draft.branding.brandName ||
        draft.organization.displayName ||
        draft.organization.legalName ||
        "Tu organización";

    const accessUrl = `https://${tenantSlug}.${rootDomain}`;
    const adminEmail = draft.adminUser.email || draft.businessPartner.email || "-";

    async function handleGoToDashboard() {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setLoginError("");

        try {
            if (!draft.adminUser.setupPasswordNow || !draft.adminUser.password) {
                window.location.href = `${accessUrl}/tenant`;
                return;
            }

            const res = await fetch("/api/auth/login-from-onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tenantSlug,
                    email: draft.adminUser.email,
                    password: draft.adminUser.password,
                    remember: true,
                    next: "/dashboard",
                }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.ok) {
                setLoginError(
                    json?.message ||
                    "No fue posible iniciar sesión automáticamente. Intenta iniciar sesión manualmente."
                );
                return;
            }

            resetDraft?.();
            window.location.href = json.redirectTo;
        } catch {
            setLoginError(
                "Ocurrió un problema al iniciar sesión automáticamente. Intenta nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none fixed right-[-10%] top-20 h-[40%] w-[40%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
            <div className="pointer-events-none fixed bottom-[-10%] left-[-5%] h-[30%] w-[30%] rounded-full bg-cyan-500/10 blur-[100px]" />

            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur md:px-10">
                    <div className="flex items-center gap-4 text-slate-100">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/20">
                            <GoShieldCheck className="text-lg" />
                        </div>
                        <div>
                            <p className="text-lg font-bold tracking-tight">Remodelaciones.app</p>
                            <p className="text-xs text-slate-500">Setup complete</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-300">Entorno listo</p>
                        <p className="text-xs text-fuchsia-300">Provisionado completado</p>
                    </div>
                </header>

                <section className="flex flex-1 items-center justify-center px-6 py-12">
                    <div className="w-full">
                        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
                            <div className="relative mb-10">
                                <div className="relative z-10 flex size-24 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-[0_0_40px_rgba(217,70,239,0.35)]">
                                    <GoCheckCircle className="text-5xl" />
                                </div>
                                <div className="absolute -bottom-2 -left-6 size-12 rounded-full bg-fuchsia-500 opacity-40 blur-2xl" />
                                <div className="absolute -right-4 -top-4 size-8 rounded-full bg-cyan-400 opacity-50 blur-xl" />
                            </div>

                            <div className="mb-12 space-y-4">
                                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-50 md:text-5xl">
                                    Tu entorno enterprise <br />
                                    está <span className="text-fuchsia-400">listo</span>
                                </h1>

                                <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
                                    Bienvenido a{" "}
                                    <span className="font-semibold text-slate-200">{tenantName}</span>.
                                    La configuración inicial fue preparada correctamente y tu entorno ya
                                    está listo para continuar con la operación del tenant.
                                </p>
                            </div>

                            <div className="mb-12 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-sm">
                                <div className="h-2 w-full bg-linear-to-r from-fuchsia-500 via-fuchsia-400 to-cyan-400" />

                                <div className="p-8">
                                    <div className="mb-6 flex items-center gap-3">
                                        <GoShieldCheck className="text-lg text-fuchsia-300" />
                                        <p className="text-lg font-semibold text-slate-100">
                                            Resumen del entorno
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Access URL
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <GoGlobe className="text-fuchsia-300" />
                                                <p className="truncate text-sm font-medium text-slate-200">
                                                    {accessUrl}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Admin Email
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <GoMail className="text-fuchsia-300" />
                                                <p className="truncate text-sm font-medium text-slate-200">
                                                    {adminEmail}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Tenant
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-slate-200">
                                                {tenantSlug || "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Roles / Ranges
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-slate-200">
                                                {draft.roles.roles.length} roles ·{" "}
                                                {draft.numberRanges.ranges.length} ranges
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleGoToDashboard}
                                    disabled={isSubmitting}
                                    className="inline-flex min-w-55 items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                                >
                                    {isSubmitting ? "Ingresando..." : "Ir al login"}
                                    <FaArrowRight size={18} />
                                </button>
                            </div>

                            {loginError ? (
                                <div className="mt-6 w-full max-w-2xl rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-left">
                                    <p className="text-sm text-rose-300">{loginError}</p>
                                </div>
                            ) : null}

                            <div className="mt-14 flex items-center gap-2 text-sm text-slate-500">
                                <IoIosHelpCircleOutline size={18} />
                                <span>
                                    ¿Necesitas ayuda?{" "}
                                    <button
                                        type="button"
                                        className="cursor-pointer font-medium text-fuchsia-300 transition hover:underline"
                                    >
                                        Contactar soporte
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}