import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AdminUserForm } from "@/components/onboarding/forms/admin-user-form";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

export default function AdminUserOnboardingPage() {
    return (
        <OnboardingShell
            currentStepId="admin-user"
            stepTitle="Administrador inicial"
            stepDescription="Configura el usuario principal que tendrá control inicial del tenant, acceso administrativo y capacidad de gestión de usuarios."
            stepNumber={6}
            totalSteps={10}
            backHref="/onboarding/business-partner"
            nextHref="/onboarding/roles"
            nextLabel="Continuar a roles y accesos"
            helpPanel={
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-fuchsia-300">
                            <MdOutlineAdminPanelSettings size={18}/>
                            <h3 className="text-sm font-semibold">Cuenta principal</h3>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                            Este usuario será el primer administrador del tenant y podrá entrar
                            al sistema desde el primer día para completar configuraciones posteriores.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">
                            Responsabilidades
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-400">
                            <li>Gestionar usuarios y accesos.</li>
                            <li>Administrar configuración general del tenant.</li>
                            <li>Controlar permisos y estructura base.</li>
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                        <h4 className="text-sm font-semibold text-slate-100">Consejo</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Puedes usar contraseña inicial o luego cambiar a un flujo por invitación
                            cuando conectemos backend y correo.
                        </p>
                    </section>
                </div>
            }
        >
            <AdminUserForm />
        </OnboardingShell>
    );
}