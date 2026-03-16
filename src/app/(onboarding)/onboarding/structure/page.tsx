import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { StructureForm } from "@/components/onboarding/forms/structure-form";
import { MdOutlineAccountTree } from "react-icons/md";

export default function StructureOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="structure"
            stepTitle="Estructura base"
            stepDescription="Define la unidad organizacional principal y la ubicación inicial que servirán como base operativa del tenant."
            stepNumber={4}
            totalSteps={10}
            backHref="/onboarding/regional"
            nextHref="/onboarding/business-partner"
            nextLabel="Continuar a business partner"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <MdOutlineAccountTree size={18}/>
                            <h3 className="text-sm font-semibold">Estructura organizacional</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Aquí defines la unidad principal del tenant y la primera ubicación
                            física u operativa desde donde funcionará la organización.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Para el onboarding inicial, crea una sola unidad principal y una sola
                            ubicación base. Luego podrás expandir la estructura.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Importante</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Esta estructura se usará después para relacionar business partners,
                            usuarios, proyectos y procesos operativos.
                        </p>
                    </section>
                </div>
            }
        >
            <StructureForm />
        </OnboardingShell>
    );
}