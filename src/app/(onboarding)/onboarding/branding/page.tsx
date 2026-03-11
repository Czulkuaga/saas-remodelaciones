import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BrandingForm } from "@/components/onboarding/forms/branding-form";
import { LuPaintRoller } from "react-icons/lu";

export default function BrandingOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="branding"
            stepTitle="Branding de la organización"
            stepDescription="Personaliza la identidad visual inicial del tenant para que el workspace refleje tu marca desde el primer acceso."
            stepNumber={2}
            totalSteps={9}
            backHref="/onboarding/organization"
            nextHref="/onboarding/regional"
            nextLabel="Continuar a configuración regional"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <LuPaintRoller size={18}/>
                            <h3 className="text-sm font-semibold">Guía de branding</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            En esta etapa puedes definir el nombre visible de la marca, colores
                            base y referencias visuales para el login, sidebar y panel principal.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendaciones
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-400">
                            <li>Usa un color primario consistente con tu marca.</li>
                            <li>El color secundario debe complementar, no competir.</li>
                            <li>Puedes iniciar con branding por defecto y cambiarlo luego.</li>
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Vista previa
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Los cambios se reflejarán más adelante en login, navegación lateral y
                            acentos interactivos del sistema.
                        </p>
                    </section>
                </div>
            }
        >
            <BrandingForm />
        </OnboardingShell>
    );
}