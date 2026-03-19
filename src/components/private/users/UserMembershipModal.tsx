// src/app/(private)/users/UserMembershipModal.client.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { TenantUserRow } from "@/action/users/user-actions";
import { createOrAttachTenantUserAction, updateTenantUserAndMembershipAction } from "@/action/users/user-actions";
import { MembershipCategory } from "../../../../generated/prisma/enums";

export function UserMembershipModal({
    open,
    initial,
    onClose,
    onSaved,
    onCreated,
}: {
    open: boolean;
    initial: TenantUserRow | null;
    onClose: () => void;
    onSaved: (row: TenantUserRow) => void;
    onCreated: (row: TenantUserRow) => void;
}) {
    const [isPending, startTransition] = useTransition();

    // create fields
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    // shared/editable fields
    const [password, setPassword] = useState("");
    const [phone10, setPhone10] = useState("");

    // membership fields
    const [category, setCategory] = useState<MembershipCategory>(MembershipCategory.USER);
    const [membershipActive, setMembershipActive] = useState(true);

    const isEdit = !!initial;
    const title = useMemo(() => (isEdit ? "Editar usuario del tenant" : "Agregar usuario al tenant"), [isEdit]);

    const canSubmitPhone = phone10.length === 10;

    const ALLOWED_MEMBERSHIP_CATEGORIES = Object.values(MembershipCategory).filter(
        (c) => c !== MembershipCategory.SUPERADMIN
    );

    function onlyDigits10(v: string) {
        return v.replace(/\D/g, "").slice(0, 10);
    }

    function fromE164To10(e164?: string | null) {
        if (!e164) return "";
        const digits = e164.replace(/\D/g, "");
        // +57XXXXXXXXXX -> "57" + 10 dígitos
        if (digits.startsWith("57") && digits.length >= 12) return digits.slice(2, 12);
        // si por alguna razón llega solo el 10
        if (digits.length === 10) return digits;
        return digits.slice(-10);
    }

    useEffect(() => {
        if (!open) return;

        if (initial) {
            setEmail(initial.user.email);
            setName(initial.user.name ?? "");
            setPassword("");
            setCategory(initial.category);
            setMembershipActive(initial.isActive);

            // ✅ cargar phone10 desde phone (10 dígitos) o phoneNormalized (+57...)
            const rawPhone =
                (initial.user as any).phone ??
                (initial.user as any).phone10 ??
                (initial.user as any).phoneNormalized ??
                null;

            if (typeof rawPhone === "string" && rawPhone.startsWith("+")) {
                setPhone10(fromE164To10(rawPhone));
            } else if (typeof rawPhone === "string") {
                setPhone10(onlyDigits10(rawPhone));
            } else {
                setPhone10("");
            }
        } else {
            setEmail("");
            setName("");
            setPassword("");
            setPhone10("");
            setCategory(MembershipCategory.USER);
            setMembershipActive(true);
        }
    }, [open, initial]);

    if (!open) return null;

    function submit() {
        if (!canSubmitPhone) {
            alert("Teléfono inválido: deben ser 10 dígitos (solo números).");
            return;
        }

        startTransition(async () => {
            if (initial) {
                const res = await updateTenantUserAndMembershipAction({
                    membershipId: initial.id,
                    category,
                    membershipActive,
                    phone10,
                    password, // opcional
                });

                if (!res.ok) return alert(res.message);
                onSaved(res.row);
                return;
            }

            const res = await createOrAttachTenantUserAction({
                email,
                name,
                category,
                phone10,   // requerido
                password,  // requerido SOLO si el user global no existe (según backend)
            });

            if (!res.ok) return alert(res.message);
            onCreated(res.row);
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isEdit
                                ? "Puedes actualizar teléfono, contraseña y datos de la membresía del tenant."
                                : "Crea o vincula un usuario a este tenant."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {!isEdit ? (
                        <>
                            <Field label="Email">
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                                />
                            </Field>

                            <Field label="Nombre (opcional)">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                                />
                            </Field>
                        </>
                    ) : (
                        <>
                            <Field label="Email (solo lectura)">
                                <input
                                    value={email}
                                    readOnly
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </Field>

                            <Field label="Nombre (solo lectura)">
                                <input
                                    value={name}
                                    readOnly
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </Field>
                        </>
                    )}

                    {/* ✅ Phone requerido en ambos casos */}
                    <Field label="Número de celular (10 dígitos, solo números)">
                        <input
                            value={phone10}
                            onChange={(e) => setPhone10(onlyDigits10(e.target.value))}
                            placeholder="3001234567"
                            inputMode="numeric"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-slate-500">
                                Se guardará como <span className="font-semibold">+57{phone10 || "XXXXXXXXXX"}</span> (WhatsApp).
                            </p>
                            <span className={["text-[11px]", canSubmitPhone ? "text-emerald-600" : "text-rose-600"].join(" ")}>
                                {canSubmitPhone ? "OK" : "Requerido"}
                            </span>
                        </div>
                    </Field>

                    {/* ✅ Password: create (si user no existe), edit (opcional) */}
                    <Field label={isEdit ? "Cambiar contraseña (opcional)" : "Password inicial (si el usuario no existe)"}>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder={isEdit ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                        />
                    </Field>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                    <Field label="Categoría (TenantMembership)">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as MembershipCategory)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
                        >
                            {ALLOWED_MEMBERSHIP_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 select-none">
                        <input
                            checked={membershipActive}
                            onChange={(e) => setMembershipActive(e.target.checked)}
                            type="checkbox"
                            className="size-4 rounded border-slate-300 dark:border-slate-700"
                        />
                        Membresía activa en este tenant
                    </label>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={submit}
                        disabled={isPending || !canSubmitPhone}
                        className="rounded-xl px-3 py-2 text-sm font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-60"
                    >
                        {isPending ? "Guardando…" : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div>
            {children}
        </div>
    );
}