import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ReviewForm } from "@/components/onboarding/forms/review-form";
import { MdAddTask } from "react-icons/md";

export default function ReviewOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="review"
            stepTitle="Revisión y aprovisionamiento"
            stepDescription="Verifica la configuración completa del tenant antes de ejecutar la creación definitiva del entorno."
            stepNumber={9}
            totalSteps={9}
            backHref="/onboarding/number-ranges"
            nextLabel="Provisionar entorno"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <MdAddTask size={18}/>
                            <h3 className="text-sm font-semibold">Verificación final</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Esta pantalla reúne toda la configuración del onboarding y valida que
                            el tenant tenga lo mínimo necesario para ser provisionado correctamente.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Revisa especialmente nombre del tenant, business partner principal,
                            administrador inicial, roles y numeración, porque esos datos serán la base
                            operativa del entorno.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Siguiente paso</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Al confirmar, pasaremos a la pantalla de provisioning. Por ahora será
                            una simulación visual del proceso hasta que conectemos el backend real.
                        </p>
                    </section>
                </div>
            }
        >
            <ReviewForm />
        </OnboardingShell>
    );
}