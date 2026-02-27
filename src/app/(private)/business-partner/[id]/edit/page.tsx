import { notFound } from "next/navigation";
import { getBusinessPartnerByIdAction } from "@/action/business-partner/business-partner";
import { BusinessPartnerEditFormClient } from "@/components";
import Link from "next/link";

type SP = Record<string, string>;

export default async function BusinessPartnerEditPage({ params }: { params: Promise<SP> | SP; }) {
    const p = (await params) ?? {};
    const bp = await getBusinessPartnerByIdAction(p.id);
    if (!bp) return notFound();

    return (
        <section className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark/50">
            <div className="mx-auto space-y-6">
                <div>
                    <div className="flex items-center mb-2">
                        <Link
                            href="/business-partner"
                            className="text-xs font-bold text-slate-400 hover:text-fuchsia-300 transition"
                        >
                            ← Volver al listado
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Editar tercero
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        BP {bp.code}
                    </p>
                </div>

                <BusinessPartnerEditFormClient initial={bp} />
            </div>
        </section>
    );
}