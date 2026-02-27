import { BusinessPartnerCreateFormClient } from "@/components";

export default async function BusinessPartnerNewPage() {
    return (
        <section className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark/50">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Nuevo tercero</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Crea una persona u organización para usarla en proyectos, compras, contratos y equipo.
                    </p>
                </div>

                <BusinessPartnerCreateFormClient />
            </div>
        </section>
    );
}