"use client";

import Link from "next/link";
import React from "react";
import { GoShieldLock } from "react-icons/go";

export default function TenantSecurityCardClient() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-fuchsia-500/10 rounded-xl">
            <GoShieldLock size={30} className="text-fuchsia-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Accesos y Roles</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Controla políticas de sesiones y la administración de permisos (globales vs. por tenant).
            </p>
          </div>
        </div>

        <Link href={"/roles"}>
          <button
            type="button"
            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-fuchsia-600"
          >
            Configurar
          </button>
        </Link>
      </div>
    </div>
  );
}