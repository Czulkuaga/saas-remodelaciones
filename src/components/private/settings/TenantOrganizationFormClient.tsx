"use client";

import { useState } from "react";
import type { TenantSettingsDTO } from "@/types/settings/types";
// import { saveTenantSettingsAction } from "@/action/tenant-settings";

export default function TenantOrganizationFormClient({ initial }: { initial: TenantSettingsDTO }) {
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function action(formData: FormData) {
    setMsg(null);

    // const res = await saveTenantSettingsAction(formData);
    const res = {ok: true};

    if (!res.ok) {
      setMsg({ type: "error", text: "Revisa los campos marcados (validación)." });
      return;
    }

    setMsg({ type: "success", text: "Cambios guardados correctamente." });
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
        <h3 className="font-bold text-sm">Datos del Tenant</h3>

        <div className="flex items-center gap-2 px-3 py-1 bg-background-dark rounded-lg border border-fuchsia-500/20">
          <span className="text-[10px] text-fuchsia-500/70 font-bold uppercase">BUKRS:</span>
          <span className="text-[10px] font-mono font-bold text-fuchsia-500">{initial.code}</span>
        </div>
      </div>

      <form action={action} className="p-6">
        {msg && (
          <div
            className={[
              "mb-6 rounded-xl border px-4 py-3 text-sm",
              msg.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-rose-500/20 bg-rose-500/10",
            ].join(" ")}
          >
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nombre del Tenant
            </label>
            <input
              name="name"
              defaultValue={initial.name}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all"
            />
          </div>

          {/* Slug (solo lectura por seguridad) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Slug (Subdominio)
            </label>
            <input
              value={initial.slug}
              disabled
              className="bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm opacity-80 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Este valor normalmente no se cambia para no romper URLs y routing multi-tenant.
            </p>
          </div>

          {/* País */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              País
            </label>
            <select
              name="countryCode"
              defaultValue={initial.countryCode ?? ""}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none"
            >
              <option value="">(Sin país)</option>
              {initial.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Moneda */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Moneda por defecto
            </label>
            <select
              name="defaultCurrencyCode"
              defaultValue={initial.defaultCurrencyCode}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none"
            >
              {initial.currencies.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} — {x.name}
                  {x.symbol ? ` (${x.symbol})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Locale */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Locale por defecto
            </label>
            <select
              name="defaultLocaleCode"
              defaultValue={initial.defaultLocaleCode}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none"
            >
              {initial.locales.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.name} ({x.code})
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Zona horaria por defecto
            </label>
            <select
              name="defaultTimeZoneId"
              defaultValue={initial.defaultTimeZoneId}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none"
            >
              {initial.timeZones.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end">
          <button
            type="submit"
            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600"
          >
            Guardar desde Form
          </button>
        </div>
      </form>
    </div>
  );
}