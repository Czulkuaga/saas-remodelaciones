"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    GoCheckCircle,
    GoDatabase,
    GoGear,
    GoInfo,
    GoLock,
    GoNumber,
    GoOrganization,
    GoShieldCheck,
    GoSync,
    GoTools,
    GoZap,
} from "react-icons/go";
import { useOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";

type ProvisioningLogStatus = "SUCCESS" | "EXECUTE" | "WAITING";

type ProvisioningLogItem = {
    id: string;
    status: ProvisioningLogStatus;
    text: string;
};

const FINAL_PROGRESS = 100;
const STEP_INTERVAL_MS = 1200;

function getStatusClass(status: ProvisioningLogStatus) {
    if (status === "SUCCESS") return "text-emerald-400";
    if (status === "EXECUTE") return "text-fuchsia-300";
    return "text-slate-500";
}

function getStatusLabel(status: ProvisioningLogStatus) {
    if (status === "SUCCESS") return "[SUCCESS]";
    if (status === "EXECUTE") return "[EXECUTE]";
    return "[WAITING]";
}

export function ProvisioningView() {
    const router = useRouter();
    const { draft, hydrated } = useOnboardingDraft();

    const baseLogs = useMemo<ProvisioningLogItem[]>(
        () => [
            {
                id: "env",
                status: "SUCCESS",
                text: "Initialized provisioning environment v.1.0.0",
            },
            {
                id: "identity",
                status: "SUCCESS",
                text: `Verified admin identity for ${draft.adminUser.email || "initial admin"}`,
            },
            {
                id: "tenant",
                status: "EXECUTE",
                text: `Creating tenant workspace '${draft.organization.slug || "tenant"}'...`,
            },
            {
                id: "branding",
                status: "WAITING",
                text: "Applying branding tokens, colors and visual configuration...",
            },
            {
                id: "structure",
                status: "WAITING",
                text: "Creating base organizational structure and primary location...",
            },
            {
                id: "bp",
                status: "WAITING",
                text: "Creating main business partner and legal identifiers...",
            },
            {
                id: "admin",
                status: "WAITING",
                text: "Provisioning initial administrator and tenant membership...",
            },
            {
                id: "roles",
                status: "WAITING",
                text: "Assigning roles, permissions and access control profiles...",
            },
            {
                id: "ranges",
                status: "WAITING",
                text: "Generating number ranges for tenant entities...",
            },
            {
                id: "health",
                status: "WAITING",
                text: "Running environment health checks and readiness validation...",
            },
        ],
        [draft.adminUser.email, draft.organization.slug]
    );

    const [progress, setProgress] = useState(12);
    const [activeIndex, setActiveIndex] = useState(2);
    const [logs, setLogs] = useState<ProvisioningLogItem[]>(baseLogs);

    useEffect(() => {
        setLogs(baseLogs);
    }, [baseLogs]);

    useEffect(() => {
        if (!hydrated) return;

        if (activeIndex >= logs.length) {
            const finalTimer = window.setTimeout(() => {
                router.push("/onboarding/success");
            }, 1400);

            return () => window.clearTimeout(finalTimer);
        }

        const timer = window.setTimeout(() => {
            setLogs((prev) =>
                prev.map((item, index) => {
                    if (index < activeIndex) return { ...item, status: "SUCCESS" };
                    if (index === activeIndex) return { ...item, status: "EXECUTE" };
                    return { ...item, status: "WAITING" };
                })
            );

            const nextProgress = Math.min(
                FINAL_PROGRESS,
                Math.round(((activeIndex + 1) / logs.length) * 100)
            );

            setProgress(nextProgress);
            setActiveIndex((prev) => prev + 1);
        }, STEP_INTERVAL_MS);

        return () => window.clearTimeout(timer);
    }, [activeIndex, hydrated, logs.length, router]);

    if (!hydrated) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
                Cargando provisión...
            </main>
        );
    }

    const tenantName =
        draft.branding.brandName ||
        draft.organization.displayName ||
        draft.organization.legalName ||
        "Tu organización";

    const currentStepLabel =
        logs[Math.min(activeIndex, logs.length - 1)]?.text ??
        "Finalizando provisioning...";

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
            <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-fuchsia-500/5 blur-[120px]" />

            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4 backdrop-blur md:px-10">
                    <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/20">
                            <GoZap className="text-lg" />
                        </div>

                        <div>
                            <p className="text-base font-semibold text-slate-100">
                                {tenantName}
                            </p>
                            <p className="text-xs text-slate-500">Provisioning del entorno</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                            Provisioning
                        </p>
                        <p className="text-sm text-slate-400">Paso final</p>
                    </div>
                </header>

                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12">
                    <div className="w-full max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
                            Finalizando el entorno
                        </h1>
                        <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">
                            Estamos creando la estructura base del tenant, configurando seguridad,
                            numeración y acceso inicial. Este proceso es visual por ahora y luego
                            lo conectaremos al backend real.
                        </p>
                    </div>

                    <div className="relative mt-12 flex h-72 w-72 items-center justify-center md:h-80 md:w-80">
                        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-fuchsia-500/10 border-t-fuchsia-400" />
                        <div className="absolute inset-8 animate-[spin_5s_linear_infinite_reverse] rounded-full border-2 border-slate-700/50 border-r-fuchsia-500/40" />
                        <div className="absolute inset-0 rounded-full border border-fuchsia-500/20" />

                        <div className="relative z-10 text-center">
                            <div className="text-6xl font-black text-slate-50">
                                {progress}
                                <span className="text-2xl text-fuchsia-300">%</span>
                            </div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/70">
                                System Ready
                            </div>
                        </div>

                        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center">
                            <div className="h-8 w-px bg-linear-to-t from-fuchsia-400 to-transparent" />
                            <span className="mt-1 text-[10px] font-mono text-fuchsia-300/80">
                                TENANT_CORE
                            </span>
                        </div>

                        <div className="absolute -right-12.5 top-1/2 flex -translate-y-1/2 items-center">
                            <span className="mr-2 text-[10px] font-mono text-fuchsia-300/80">
                                ACL_READY
                            </span>
                            <div className="h-px w-8 bg-linear-to-r from-fuchsia-400 to-transparent" />
                        </div>
                    </div>

                    <div className="mt-10 w-full max-w-2xl rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-6 backdrop-blur-sm">
                        <div className="mb-4 flex items-end justify-between gap-4">
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                                    Despliegue global
                                </span>
                                <h3 className="mt-1 text-sm font-medium text-slate-100">
                                    {currentStepLabel}
                                </h3>
                            </div>
                            <span className="font-mono text-lg text-slate-100">
                                {progress.toFixed(0)}%
                            </span>
                        </div>

                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="absolute left-0 top-0 h-full rounded-full bg-fuchsia-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-0 h-full w-24 bg-linear-to-r from-transparent to-white/20" />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>
                                Estado: {progress >= 100 ? "FINALIZANDO" : "WORKING"}
                            </span>
                            <span>
                                Tenant: {draft.organization.slug || "pending-slug"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/40 px-4 py-3">
                            <div className="flex gap-1.5">
                                <div className="size-2.5 rounded-full bg-rose-500/50" />
                                <div className="size-2.5 rounded-full bg-amber-500/50" />
                                <div className="size-2.5 rounded-full bg-emerald-500/50" />
                            </div>

                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                Provisioning log
                            </div>

                            <GoSync className="text-sm text-slate-500" />
                        </div>

                        <div className="h-72 space-y-3 overflow-y-auto p-6 font-mono text-sm">
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-4">
                                    <span className={getStatusClass(log.status)}>
                                        {getStatusLabel(log.status)}
                                    </span>
                                    <span
                                        className={
                                            log.status === "WAITING"
                                                ? "text-slate-500"
                                                : "text-slate-200"
                                        }
                                    >
                                        {log.text}
                                    </span>
                                </div>
                            ))}

                            {progress < 100 ? (
                                <div className="flex animate-pulse gap-4">
                                    <span className="text-fuchsia-300">&gt;</span>
                                    <span className="text-fuchsia-300">
                                        Ejecutando secuencia de aprovisionamiento...
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-8 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-6 py-4">
                        <GoInfo className="mt-0.5 text-amber-400" />
                        <p className="text-sm leading-6 text-amber-200/80">
                            No cierres esta ventana mientras termina la simulación del proceso.
                            Luego serás redirigido automáticamente a la pantalla final de éxito.
                        </p>
                    </div>

                    <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                            <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                                <GoOrganization className="text-lg" />
                                <p className="text-sm font-medium">Tenant</p>
                            </div>
                            <p className="text-sm text-slate-300">
                                {draft.organization.displayName || draft.organization.legalName}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                            <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                                <GoDatabase className="text-lg" />
                                <p className="text-sm font-medium">Estructura</p>
                            </div>
                            <p className="text-sm text-slate-300">
                                {draft.structure.orgUnitName} / {draft.structure.locationName}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                            <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                                <GoShieldCheck className="text-lg" />
                                <p className="text-sm font-medium">Seguridad</p>
                            </div>
                            <p className="text-sm text-slate-300">
                                {draft.roles.roles.length} roles / {draft.numberRanges.ranges.length} rangos
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="px-8 py-8 text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                        Secure tenant provisioning engine
                    </p>
                </footer>
            </div>
        </main>
    );
}