"use client";

import { useMemo, useState, useTransition } from "react";
import type { TenantSettingsDTO } from "@/types/settings/types";
import TenantOrgIdentifierModalClient from "./TenantOrgIdentifierModalClient";
import { deletePartnerIdentifierAction, setPartnerIdentifierPrimaryAction } from "@/action/partner-identifiers";
import { FaTrashAlt } from "react-icons/fa";
import { GrCheckboxSelected } from "react-icons/gr";

type Props = { initial: TenantSettingsDTO };

export default function TenantOrgIdentifiersCardClient({ initial }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const orgId = initial.orgBP?.id ?? null;

  const rows = useMemo(() => {
    return (initial.orgIdentifiers ?? []).map((x) => ({
      ...x,
      label: `${x.type}${x.countryCode ? ` (${x.countryCode})` : ""}`,
    }));
  }, [initial.orgIdentifiers]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-500/5 border-b border-slate-200 dark:border-fuchsia-500/10 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm">Identificadores (Fiscal / Legal)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define NIT/VAT/etc. Marca uno como Primary para documentos.
          </p>
        </div>

        <button
          type="button"
          disabled={!orgId}
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200 disabled:opacity-40 cursor-pointer"
        >
          Agregar
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {!orgId ? (
          <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-4 text-sm text-slate-800 dark:text-slate-300">
            Primero crea la empresa (BP principal) para registrar documentos.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-4 text-sm text-slate-800 dark:text-slate-300">
            Aún no hay identificadores. Agrega al menos uno (ej: NIT/VAT).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Número</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/10">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-200">{r.label}</td>
                    <td className="py-3 pr-4 font-mono text-slate-700 dark:text-slate-200">{r.value}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {r.isPrimary ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-300 border border-fuchsia-500/20">
                            Primary
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                            Secondary
                          </span>
                        )}

                        {r.isVerified ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-300 border border-emerald-500/20">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/20">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {!r.isPrimary && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await setPartnerIdentifierPrimaryAction(r.id);
                              })
                            }
                            className="text-xs font-semibold text-fuchsia-500 dark:text-fuchsia-300 hover:text-fuchsia-200 disabled:opacity-50 cursor-pointer flex gap-1"
                          >
                            <span>
                              <GrCheckboxSelected size={16} />
                            </span>
                            <span>Hacer Primary</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deletePartnerIdentifierAction(r.id);
                            })
                          }
                          className="text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50 cursor-pointer"
                        >
                          <FaTrashAlt size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Consejo: define un identificador como <span className="text-fuchsia-300 font-semibold">Primary</span> para usarlo en facturas y documentos.
        </p>
      </div>

      {/* Modal */}
      {orgId && (
        <TenantOrgIdentifierModalClient
          open={open}
          onClose={() => setOpen(false)}
          partnerId={orgId}
          countries={initial.countries}
        />
      )}
    </div>
  );
}