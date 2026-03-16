import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { NumberRangesForm } from "@/components/onboarding/forms/number-ranges-form";
import { FaHashtag } from "react-icons/fa";

export default function NumberRangesOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="number-ranges"
            stepTitle="Numeración inicial"
            stepDescription="Configura cómo se generarán los identificadores automáticos de las entidades principales del tenant."
            stepNumber={8}
            totalSteps={10}
            backHref="/onboarding/roles"
            nextHref="/onboarding/plan"
            nextLabel="Continuar a plan"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <FaHashtag size={18}/>
                            <h3 className="text-sm font-semibold">Rangos de numeración</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Aquí defines cómo se construirán los códigos automáticos para documentos
                            y entidades clave dentro del tenant.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Mantén prefijos cortos y consistentes. Por ejemplo: BP para business partner,
                            PR para proyecto, IV para factura.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Importante</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Más adelante podrás sofisticar la numeración con lógica por año,
                            sede, unidad o serie documental.
                        </p>
                    </section>
                </div>
            }
        >
            <NumberRangesForm />
        </OnboardingShell>
    );
}