import { FaTools } from "react-icons/fa";

type Props = {
    title?: string;
    description?: string;
    module?: string;
};

export function PageUnderConstruction({
    title = "Módulo en desarrollo",
    description = "Estamos trabajando en esta sección para ofrecerte una mejor experiencia. Muy pronto estará disponible.",
    module,
}: Props) {
    return (
        <div className="relative flex flex-col items-center justify-center px-6 py-28 text-center overflow-hidden">

            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
            </div>

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                En progreso
            </div>

            {/* Icon with gradient */}
            <div className="relative mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white shadow-xl shadow-indigo-500/20">
                    <FaTools size={34} />
                </div>

                {/* floating ring */}
                <div className="absolute inset-0 animate-ping rounded-3xl border border-indigo-400/30" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {title}
            </h1>

            {/* Module */}
            {module && (
                <p className="mt-3 bg-linear-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-sm font-bold uppercase tracking-wider text-transparent">
                    {module}
                </p>
            )}

            {/* Description */}
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
            </p>

            {/* Progress mock bar */}
            <div className="mt-10 w-full max-w-sm">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-2 animate-pulse rounded-full bg-linear-to-r from-indigo-600 to-fuchsia-600" />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                    Avance estimado: 0%
                </p>
            </div>

            {/* Decorative divider */}
            <div className="mt-12 h-1 w-24 rounded-full bg-linear-to-r from-indigo-500 to-fuchsia-500 opacity-60" />
        </div>
    );
}