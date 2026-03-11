import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { RegionalForm } from "@/components/onboarding/forms/regional-form";
import { IoLanguage } from "react-icons/io5";

export default function RegionalOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="regional"
            stepTitle="Configuración regional"
            stepDescription="Define cómo el tenant manejará idioma, país base, zona horaria, moneda y formatos operativos."
            stepNumber={3}
            totalSteps={9}
            backHref="/onboarding/branding"
            nextHref="/onboarding/structure"
            nextLabel="Continuar a estructura base"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <IoLanguage size={18}/>
                            <h3 className="text-sm font-semibold">Configuración regional</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Estos valores definen el comportamiento base del tenant para fechas,
                            moneda, idioma y reglas operativas iniciales.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Usa el país principal de operación como base para sugerir idioma,
                            formato de fecha y zona horaria.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Importante
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Más adelante podrás sobrescribir estos valores por sede, unidad o
                            ubicación específica.
                        </p>
                    </section>
                </div>
            }
        >
            <RegionalForm />
        </OnboardingShell>
    );
}