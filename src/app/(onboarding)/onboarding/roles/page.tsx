import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { RolesForm } from "@/components/onboarding/forms/roles-form";
import { SiAdguard } from "react-icons/si";

export default function RolesOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="roles"
            stepTitle="Roles y accesos"
            stepDescription="Configura los perfiles de acceso iniciales del tenant y define qué permisos tendrá cada rol operativo."
            stepNumber={7}
            totalSteps={9}
            backHref="/onboarding/admin-user"
            nextHref="/onboarding/number-ranges"
            nextLabel="Continuar a numeración"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <SiAdguard size={18}/>
                            <h3 className="text-sm font-semibold">Seguridad inicial</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Aquí defines qué puede hacer cada perfil dentro del tenant. Los permisos
                            son del sistema, pero los roles se configuran por tenant.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Recomendación
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Mantén un rol administrador con acceso completo y crea roles más limitados
                            para operación y consulta.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Importante</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            El administrador inicial debe quedar asignado a un rol válido desde este paso.
                        </p>
                    </section>
                </div>
            }
        >
            <RolesForm />
        </OnboardingShell>
    );
}