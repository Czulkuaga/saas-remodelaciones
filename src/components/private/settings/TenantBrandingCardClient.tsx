"use client";

import React, { useId, useRef, useState, useTransition } from "react";
import type { TenantSettingsDTO } from "../../../types/settings/types";
import { FaRegImage } from "react-icons/fa";
// Si ya tienes actions en src/action, descomenta y ajusta el import:
// import { uploadTenantLogoAction, deleteTenantLogoAction } from "@/action/tenant-settings";

export default function TenantBrandingCardClient({ initial }: { initial: TenantSettingsDTO }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(initial.branding.logoLightUrl ?? null);
  const [logoName, setLogoName] = useState<string>(initial.branding.logoName ?? "Sin logo");
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function openPicker() {
    setError(null);
    fileRef.current?.click();
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    // Validación rápida (2MB)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("El archivo supera 2MB.");
      return;
    }

    // Preview inmediato
    const previewUrl = URL.createObjectURL(file);
    setLogoUrl(previewUrl);
    setLogoName(file.name);

    // Si quieres subirlo con Server Action (recomendado)
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("file", file);

        // TODO: conecta tu action real
        // const res = await uploadTenantLogoAction(fd);
        // if (!res.ok) throw new Error(res.message ?? "No se pudo subir el logo.");
        // if (res.url) setLogoUrl(res.url);
        // if (res.name) setLogoName(res.name);

        // ✅ por ahora no hacemos nada (solo preview)
      } catch (e) {
        setError("No se pudo subir el logo. Se dejó la vista previa local.");
      }
    });
  }

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      try {
        // TODO: conecta tu action real
        // await deleteTenantLogoAction();

        setLogoUrl(null);
        setLogoName("Sin logo");
      } catch {
        setError("No se pudo eliminar el logo.");
      }
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-400 mb-6 mt-4 ml-4">Marca del Tenant</h3>

      <div className="flex flex-col items-center text-center">
        <div className="size-32 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-fuchsia-500/20 flex items-center justify-center mb-4 overflow-hidden relative group">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo del tenant" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="bg-fuchsia-500/10 absolute inset-0 flex items-center justify-center">
              <FaRegImage size={40} className="text-fuchsia-500 text-5xl" />
            </div>
          )}

          <button
            type="button"
            onClick={openPicker}
            disabled={isPending}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            title="Cambiar logo"
          >
            <span className="material-symbols-outlined text-white">edit</span>
          </button>

          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Logo actual: {logoName}. <br />
          Formatos: SVG, PNG (Máx 2MB)
        </p>

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="flex flex-col w-50 gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={isPending}
            className="cursor-pointer bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20 py-2 rounded-lg text-sm font-semibold hover:bg-fuchsia-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Procesando..." : "Subir Logo del Tenant"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-slate-800 dark:text-slate-400 hover:text-red-400 pt-2 pb-4 text-xs font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Eliminar Logo
          </button>
        </div>
      </div>
    </div>
  );
}