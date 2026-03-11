import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BusinessPartnerForm } from "@/components/onboarding/forms/business-partner-form";
import { PiBuildingApartment } from "react-icons/pi";

export default function BusinessPartnerOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="business-partner"
            stepTitle="Business partner principal"
            stepDescription="Define la entidad principal que representará legal y operativamente a la organización dentro de la plataforma."
            stepNumber={5}
            totalSteps={9}
            backHref="/onboarding/structure"
            nextHref="/onboarding/admin-user"
            nextLabel="Continuar a administrador inicial"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <PiBuildingApartment />
                            <h3 className="text-sm font-semibold">Entidad principal</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Este business partner será la organización base del tenant y podrá
                            utilizarse para documentos, reportes, referencia legal y datos de contacto.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Usa la razón social real de la empresa y un identificador legal o fiscal
                            válido según el país principal de operación.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Relación</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Este registro quedará vinculado a la ubicación principal definida en el paso anterior.
                        </p>
                    </section>
                </div>
            }
        >
            <BusinessPartnerForm />
        </OnboardingShell>
    );
}