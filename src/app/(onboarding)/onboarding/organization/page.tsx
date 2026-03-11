import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OrganizationForm } from "@/components/onboarding/forms/organization-form";
import { IoIosHelpCircleOutline } from "react-icons/io";

export default function OrganizationOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="organization"
            stepTitle="Identidad de la organización"
            stepDescription="Define la base de tu tenant: nombre comercial, slug, código interno y configuración regional principal."
            stepNumber={1}
            totalSteps={9}
            nextLabel="Continuar a branding"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <IoIosHelpCircleOutline size={18}/>
                            <h3 className="text-sm font-semibold">Ayuda contextual</h3>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-100">
                            Sobre el slug
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            El slug identifica tu organización dentro de la plataforma y luego
                            puede usarse en subdominios, URLs internas y contexto multi-tenant.
                        </p>
                    </section>
                </div>
            }
        >
            <OrganizationForm />
        </OnboardingShell>
    );
}