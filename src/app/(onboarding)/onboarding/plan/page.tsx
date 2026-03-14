import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PlanForm } from "@/components/onboarding/forms/plan-form";
import { MdWorkspacesOutline } from "react-icons/md";

export default function PlanOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="plan"
            stepTitle="Plan y suscripción"
            stepDescription="Selecciona el plan inicial del tenant y revisa el resumen de la suscripción."
            stepNumber={9}
            totalSteps={10}
            backHref="/onboarding/number-ranges"
            nextHref="/onboarding/review"
            nextLabel="Continuar a revisión"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <MdWorkspacesOutline size={18}/>
                            <h3 className="text-sm font-semibold">Plan inicial</h3>
                        </div>
                        <p className="text-sm leading-6 text-slate-400">
                            Este paso define el plan base con el que se aprovisionará el tenant.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Importante</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Puedes usar trial, planes mensuales o incluso un plan unlimited si tu lógica comercial lo permite.
                        </p>
                    </section>
                </div>
            }
        >
            <PlanForm />
        </OnboardingShell>
    );
}