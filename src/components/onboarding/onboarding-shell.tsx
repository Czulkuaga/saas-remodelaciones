"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ONBOARDING_STEPS, type OnboardingStepIconKey } from "../../types/onboarding/onboarding-step-items";
import { MdDomain} from "react-icons/md";
import { LuPaintRoller } from "react-icons/lu";

import type { IconType } from "react-icons";
import {
    GoOrganization,
    GoTag,
    GoCheckCircle,
    GoPerson,
    GoShieldLock,
    GoGlobe,
    GoRepo,
    GoChecklist,
} from "react-icons/go";
import { MdOutlinePayment } from "react-icons/md";

type OnboardingShellProps = {
    currentStepId: string;
    stepTitle: string;
    stepDescription: string;
    stepNumber: number;
    totalSteps: number;
    children: ReactNode;
    helpPanel?: ReactNode;
    onSaveDraft?: () => void;
    nextHref?: string;
    backHref?: string;
    nextLabel?: string;
};

const stepIconMap: Record<OnboardingStepIconKey, IconType> = {
    domain: GoOrganization,
    palette: LuPaintRoller,
    language: GoGlobe,
    account_tree: GoRepo,
    apartment: GoOrganization,
    person: GoPerson,
    shield: GoShieldLock,
    tag: GoTag,
    task_alt: GoChecklist,
    plans: MdOutlinePayment
};

export function OnboardingShell({
    currentStepId,
    stepTitle,
    stepDescription,
    stepNumber,
    totalSteps,
    children,
    helpPanel,
}: OnboardingShellProps) {
    const progress = Math.round((stepNumber / totalSteps) * 100);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
                <div className="border-b border-slate-800 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/20">
                            {/* <span className="material-symbols-outlined text-[20px]">
                                home_work
                            </span> */}
                            <MdDomain size={26} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-100">
                                Remodelaciones.app
                            </p>
                            <p className="text-xs text-slate-400">Onboarding inicial</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-medium uppercase tracking-[0.18em] text-slate-500">
                                Progreso
                            </span>
                            <span className="font-semibold text-fuchsia-300">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-fuchsia-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {ONBOARDING_STEPS.map((step, index) => {
                            const isActive = step.id === currentStepId;
                            const isDone = index + 1 < stepNumber;
                            const StepIcon = stepIconMap[step.icon] ?? GoOrganization;

                            return (
                                <Link
                                    key={step.id}
                                    href={step.href}
                                    className={[
                                        "flex items-center gap-3 rounded-xl border px-3 py-3 transition-all",
                                        isActive
                                            ? "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300"
                                            : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200",
                                    ].join(" ")}
                                >
                                    <StepIcon className="shrink-0 text-[20px]" />

                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{step.title}</p>
                                    </div>

                                    {isDone ? (
                                        <GoCheckCircle className="shrink-0 text-[18px] text-emerald-400" />
                                    ) : null}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto border-t border-slate-800 p-4">
                    <div className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-4">
                        <p className="text-sm font-semibold text-slate-100">
                            ¿Necesitas ayuda?
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Configura tu organización paso a paso y deja listo el tenant para operar.
                        </p>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-20.25 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur md:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/20 lg:hidden">
                            <GoCheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-100">{stepTitle}</p>
                            <p className="text-xs text-slate-400">
                                Paso {stepNumber} de {totalSteps}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* <button
                            type="button"
                            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                help
                            </span>
                        </button> */}
                    </div>
                </header>

                <div className="flex flex-1">
                    <main className="flex-1 px-4 py-8 md:px-6 xl:px-10">
                        <div className="mx-auto max-w-5xl">
                            <div className="mb-8">
                                <div className="mb-4 inline-flex items-center rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                                    Paso {stepNumber}
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
                                    {stepTitle}
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                                    {stepDescription}
                                </p>
                            </div>

                            {children}
                        </div>
                    </main>

                    {helpPanel ? (
                        <aside className="hidden w-80 shrink-0 border-l border-slate-800 bg-slate-950/70 p-6 xl:block">
                            {helpPanel}
                        </aside>
                    ) : null}
                </div>

                {/* <footer className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur md:px-6">
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                        <button
                            type="button"
                            onClick={onSaveDraft}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            <FaRegSave size={20} />
                            Guardar borrador
                        </button>

                        <div className="flex items-center gap-3">
                            {backHref ? (
                                <Link
                                    href={backHref}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                                >
                                    Atrás
                                </Link>
                            ) : null}

                            {nextHref ? (
                                <Link
                                    href={nextHref}
                                    className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                                >
                                    {nextLabel}
                                    <FaArrowRight size={18} />
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </footer> */}
            </div>
        </div>
    );
}