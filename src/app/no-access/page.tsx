// src/app/no-access/page.tsx
import Link from "next/link";

export default function NoAccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
                <div className="w-full rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/30 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                            <span className="material-symbols-outlined">lock</span>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Acceso denegado
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Tu usuario no tiene permisos o membresía activa para acceder a esta clínica.
                                Si necesitas acceso, solicita al administrador que te habilite.
                            </p>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    Cambiar de cuenta
                                </Link>

                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                                >
                                    Ir al inicio
                                </Link>
                            </div>

                            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                    Qué puede estar pasando
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    <li>Tu membresía está inactiva o fue removida del tenant.</li>
                                    <li>No tienes roles asignados o tus roles no tienen permisos.</li>
                                    <li>Estás intentando entrar al subdominio de otra clínica.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
                        Código: NO_ACCESS
                    </p>
                </div>
            </div>
        </div>
    );
}