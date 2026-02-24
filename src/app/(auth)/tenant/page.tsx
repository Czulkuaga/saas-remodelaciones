import { MdDomain } from "react-icons/md";
import { SiAdguard } from "react-icons/si";
import { IoLockClosed } from "react-icons/io5";
import { FormTenant } from "@/components";

export default function page() {
    return (
        <section className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-32 -left-32 h-112 w-md rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-400/10" />
                <div className="absolute top-1/2 -right-32 h-96 w-[24rem] rounded-full bg-fuchsia-500/15 blur-[110px] dark:bg-fuchsia-400/10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_55%)]" />
            </div>

            <div className="relative w-full max-w-xl md:mt-20">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/90" />
                        Acceso por organización
                    </div>

                    <div className="mt-6 flex justify-center">
                        <div className="relative">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
                                <MdDomain size={26} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="absolute -right-2 -bottom-2 rounded-xl bg-linear-to-br from-indigo-600 to-fuchsia-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
                                Tenant
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                    <div className="p-8">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Encuentra tu organización
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Ingresa el <span className="font-semibold">dominio</span> o el{" "}
                            <span className="font-semibold">nombre</span> asignado a tu cuenta para continuar.
                        </p>

                        <div className="mt-6">
                            <FormTenant />
                        </div>

                        {/* Subtle hint / helper */}
                        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                            Tip: si tu URL es{" "}
                            <span className="font-mono font-semibold">empresa.tudominio.com</span>, normalmente tu
                            organización es <span className="font-mono font-semibold">empresa</span>.
                        </div>
                    </div>

                    {/* Footer trust */}
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-8 py-5 dark:border-slate-800 dark:bg-slate-900/30 sm:flex-row">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <IoLockClosed size={16} />
                            Conexión segura
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <SiAdguard size={16} />
                            Buenas prácticas de seguridad
                        </div>
                    </div>
                </div>

                {/* Small footer */}
                <div className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-500">
                    Si no tienes tu organización, solicita el acceso a tu administrador.
                </div>
            </div>
        </section>
    );
}