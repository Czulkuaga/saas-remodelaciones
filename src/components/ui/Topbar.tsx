"use client"

import { FaSearch, FaBell } from "react-icons/fa";
import { MdExpandMore } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import { useShellStore } from "@/store/ui/shell-store";

export function Topbar() {
  const toggleMobileSidebar = useShellStore((s) => s.toggleMobileSidebar);
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/70 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70">

      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-indigo-300"
        aria-label="Abrir menú"
      >
        <GiHamburgerMenu size={20} />
      </button>

      {/* SEARCH */}
      <div className="flex flex-1 max-w-xl items-center gap-4">
        <div className="relative w-full">
          <FaSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className={[
              "w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all",
              "border-slate-200 placeholder:text-slate-400",
              "focus:ring-2 focus:ring-indigo-500/30 focus:border-transparent",
              "dark:bg-slate-950 dark:text-white dark:border-slate-800 dark:placeholder:text-slate-500",
              "dark:focus:ring-indigo-400/25",
            ].join(" ")}
            placeholder="Buscar usuarios, módulos o registros..."
            type="text"
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">

        {/* NOTIFICATIONS */}
        <button
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-indigo-400"
          type="button"
        >
          <FaBell size={20} />

          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-slate-950" />
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

        {/* USER */}
        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-900">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            U
          </div>

          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Usuario
            </span>
            <span className="text-xs text-slate-400">
              Administrador
            </span>
          </div>

          <MdExpandMore size={20} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}