import { FaInfoCircle } from "react-icons/fa";
import type { TenantSettingsDTO } from "../../../types/settings/types";

function formatDate(d: Date) {
    // formato simple y consistente (sin libs)
    return new Intl.DateTimeFormat("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(d));
}

export default function TenantStatusCard({ initial }: { initial: TenantSettingsDTO }) {
    const statusLabel =
        initial.status === "ACTIVE"
            ? "Activo"
            : initial.status === "SUSPENDED"
                ? "Suspendido"
                : "Eliminado";

    const statusColor =
        initial.status === "ACTIVE"
            ? "text-emerald-500 bg-emerald-500/10"
            : initial.status === "SUSPENDED"
                ? "text-amber-500 bg-amber-500/10"
                : "text-red-500 bg-red-500/10";

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
                <FaInfoCircle size={20} className="text-fuchsia-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Estado del Tenant</h3>
            </div>

            {/* INFO BASE */}
            <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Código (BUKRS)</span>
                    <span className="text-xs font-mono font-semibold text-fuchsia-500">{initial.code}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Estado</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">País</span>
                    <span className="text-xs font-medium">{initial.countryCode ?? "—"}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Locale</span>
                    <span className="text-xs font-medium">{initial.defaultLocaleCode}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Zona Horaria</span>
                    <span className="text-xs font-medium">{initial.defaultTimeZoneId}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Moneda</span>
                    <span className="text-xs font-medium">{initial.defaultCurrencyCode}</span>
                </div>

                {/* FECHAS */}
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-fuchsia-500/5">
                    <span className="text-xs text-slate-500">Creado</span>
                    <span className="text-xs font-medium">{formatDate(initial.createdAt)}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-500">Actualizado</span>
                    <span className="text-xs font-medium">{formatDate(initial.updatedAt)}</span>
                </div>
            </div>

            {/* KPI MINI (SAP-like) */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Org Units</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{initial.counts.orgUnits}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Locations</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{initial.counts.locations}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Members</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{initial.counts.memberships}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Projects</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{initial.counts.remodelingProjects}</p>
                </div>
            </div>
        </div>
    );
}