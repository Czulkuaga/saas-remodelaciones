export function Footer({ clinicName }: { clinicName?: string }) {
  const org = clinicName ?? "Tu organización";

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white/40 p-8 text-center backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/30">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        © 2026 <span className="font-semibold text-slate-700 dark:text-slate-200">{org}</span>.{" "}
        Plataforma de operación y gestión. Todos los derechos reservados.
      </p>

      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/90" />
          Sistema operativo
        </span>

        <span className="text-slate-300 dark:text-slate-700">•</span>

        <span className="font-semibold">
          Seguridad y privacidad
        </span>
      </div>
    </footer>
  );
}