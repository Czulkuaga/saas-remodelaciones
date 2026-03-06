"use client";

import React, { useMemo, useState } from "react";
import { FiLock } from "react-icons/fi";
import { LuMailCheck } from "react-icons/lu";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { loginSchema, type LoginInput } from "@/lib/zod/auth";
import type { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GrHide, GrView } from "react-icons/gr";

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

function zodFieldErrors(err: z.ZodError): FieldErrors {
    const out: FieldErrors = {};
    for (const issue of err.issues) {
        const key = issue.path?.[0] as keyof LoginInput | undefined;
        if (!key) continue;
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

/**
 * Previene open-redirect:
 * - solo permite paths internos tipo "/dashboard" o "/t/demo/dashboard"
 * - bloquea "//evil.com" y "http(s)://..."
 */
function sanitizeNext(next: string | null): string | null {
    if (!next) return null;
    const v = next.trim();
    if (!v) return null;
    if (!v.startsWith("/")) return null;
    if (v.startsWith("//")) return null;
    return v;
}

export const FormLogin = () => {
    const sp = useSearchParams();
    const safeNext = useMemo(() => sanitizeNext(sp.get("next")), [sp]);

    const [values, setValues] = useState<LoginInput>({
        email: "",
        password: "",
        remember: true,
    });

    const [touched, setTouched] = useState<Partial<Record<keyof LoginInput, boolean>>>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const [isAuthing, setIsAuthing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isDirty = useMemo(() => {
        return values.email.trim() !== "" || values.password !== "" || values.remember !== true;
    }, [values]);

    function validateAll(next: LoginInput) {
        const parsed = loginSchema.safeParse(next);
        if (parsed.success) {
            setErrors({});
            return { ok: true as const, data: parsed.data };
        }
        const fieldErrors = zodFieldErrors(parsed.error);
        setErrors(fieldErrors);
        return { ok: false as const, error: parsed.error };
    }

    function validateField<K extends keyof LoginInput>(key: K, next: LoginInput) {
        const parsed = loginSchema.safeParse(next);
        if (parsed.success) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
            return;
        }
        const fe = zodFieldErrors(parsed.error);
        setErrors((prev) => ({ ...prev, [key]: fe[key] }));
    }

    const onChange =
        <K extends keyof LoginInput>(key: K) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setFormError(null);

                const next: LoginInput = {
                    ...values,
                    [key]: key === "remember" ? e.target.checked : e.target.value,
                } as LoginInput;

                setValues(next);

                if (touched[key]) validateField(key, next);
            };

    const onBlur =
        <K extends keyof LoginInput>(key: K) =>
            () => {
                setTouched((prev) => ({ ...prev, [key]: true }));
                validateField(key, values);
            };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);

        setTouched({ email: true, password: true, remember: true });

        const parsed = validateAll(values);
        if (!parsed.ok) return;

        try {
            setIsAuthing(true);

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: values.email.trim().toLowerCase(),
                    password: values.password,
                    remember: values.remember,
                    next: safeNext,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                setFormError(data.message ?? "Credenciales inválidas.");
                return;
            }

            const target = sanitizeNext(data.redirectTo ?? null) ?? safeNext ?? "/dashboard";
            window.location.href = target;
        } catch {
            setFormError("Error de red. Intenta nuevamente.");
        } finally {
            setIsAuthing(false);
        }
    }

    const emailError = touched.email ? errors.email : undefined;
    const passwordError = touched.password ? errors.password : undefined;

    const canSubmit =
        !isAuthing &&
        values.email.trim().length > 0 &&
        values.password.length > 0 &&
        !errors.email &&
        !errors.password;

    const inputBase =
        "w-full rounded-xl border bg-white px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 " +
        "dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";

    const focusOk =
        "focus:ring-2 focus:border-transparent focus:ring-indigo-500/35 " +
        "dark:focus:ring-indigo-400/25";

    const focusErr =
        "focus:ring-2 focus:border-transparent focus:ring-rose-400/40 " +
        "dark:focus:ring-rose-400/25";

    return (
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {/* Error global */}
            {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                    {formError}
                </div>
            )}

            {/* EMAIL */}
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                    Correo electrónico
                </label>

                <div className="relative">
                    <LuMailCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        value={values.email}
                        onChange={onChange("email")}
                        onBlur={onBlur("email")}
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? "email-error" : "email-help"}
                        className={[
                            inputBase,
                            "pl-10",
                            emailError
                                ? `border-rose-300 dark:border-rose-900/60 ${focusErr}`
                                : `border-slate-200 dark:border-slate-800 ${focusOk}`,
                        ].join(" ")}
                        id="email"
                        name="email"
                        placeholder="tu@empresa.com"
                        type="email"
                        autoComplete="email"
                        disabled={isAuthing}
                    />
                </div>

                <div className="mt-2 min-h-5">
                    {emailError ? (
                        <p id="email-error" className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                            {emailError}
                        </p>
                    ) : (
                        <p id="email-help" className="text-xs text-slate-500 dark:text-slate-400">
                            Usa el correo con el que registraste tu cuenta.
                        </p>
                    )}
                </div>
            </div>

            {/* PASSWORD */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                        Contraseña
                    </label>

                    <button
                        type="button"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-600/85 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                        onClick={() => setFormError("La recuperación de contraseña estará disponible pronto.")}
                        disabled={isAuthing}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />

                    <input
                        value={values.password}
                        onChange={onChange("password")}
                        onBlur={onBlur("password")}
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? "password-error" : "password-help"}
                        className={[
                            inputBase,
                            "pl-10 pr-12",
                            passwordError
                                ? `border-rose-300 dark:border-rose-900/60 ${focusErr}`
                                : `border-slate-200 dark:border-slate-800 ${focusOk}`,
                        ].join(" ")}
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={isAuthing}
                    />

                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200 disabled:opacity-50"
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        disabled={isAuthing}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {showPassword ? <GrHide size={20}/> : <GrView size={18}/>}
                        </span>
                    </button>
                </div>

                <div className="mt-2 min-h-5">
                    {passwordError ? (
                        <p id="password-error" className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                            {passwordError}
                        </p>
                    ) : (
                        <p id="password-help" className="text-xs text-slate-500 dark:text-slate-400">
                            Recomendado: mínimo 8 caracteres.
                        </p>
                    )}
                </div>
            </div>

            {/* REMEMBER */}
            <div className="flex items-center">
                <input
                    className="h-4 w-4 rounded border-slate-300 bg-slate-100 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-400 disabled:opacity-60"
                    id="remember"
                    type="checkbox"
                    checked={values.remember}
                    onChange={onChange("remember")}
                    disabled={isAuthing}
                />
                <label className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="remember">
                    Mantener sesión durante 30 días
                </label>
            </div>

            {/* SUBMIT */}
            <button
                className={[
                    "group w-full rounded-xl px-5 py-4 font-black shadow-lg transition-all flex items-center justify-center gap-2",
                    "text-white bg-linear-to-r from-indigo-600 to-fuchsia-600",
                    "hover:from-indigo-600/95 hover:to-fuchsia-600/95",
                    "shadow-indigo-500/20 dark:shadow-indigo-500/10",
                    "active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
                type="submit"
                disabled={!canSubmit}
            >
                <span className="inline-flex items-center justify-center gap-2">
                    {isAuthing && (
                        <span
                            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                            aria-hidden="true"
                        />
                    )}
                    {isAuthing ? "Iniciando sesión…" : "Entrar al panel"}
                </span>
                <span className="transition-transform group-hover:translate-x-1">
                    <FaArrowRight size={20} className="text-lg"/>
                </span>
            </button>

            {!isDirty && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Ingresa tus credenciales para continuar.
                </p>
            )}

            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/30">
                <Link
                    href={"/tenant"}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
                >
                    <FaArrowLeft size={16} />
                    Volver a elegir organización
                </Link>

                {safeNext && (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        continuar a <span className="font-mono">{safeNext}</span>
                    </span>
                )}
            </div>
        </form>
    );
};