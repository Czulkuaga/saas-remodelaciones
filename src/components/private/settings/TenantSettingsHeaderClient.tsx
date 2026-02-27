"use client";

export default function TenantSettingsHeaderClient() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración del Tenant</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Administra la identidad, operación y reglas del tenant (incluye opciones para Super Admins y políticas globales).
        </p>
      </div>

      {/* <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("tenant-settings:save"))}
        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        Guardar Cambios
      </button> */}
    </div>
  );
}