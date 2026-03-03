"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createBudgetLineAction,
    createInitialBudgetAction,
    createNextBudgetVersionAction,
    approveBudgetAction,
    deleteBudgetLineAction,
} from "@/action/projects/project-budget";
import { BudgetStatus, CostCategory } from "../../../../generated/prisma/enums";

type BudgetHeaderPick = {
    id: string;
    version: number;
    status: BudgetStatus;
    name: string | null;
    updatedAt?: Date;
};

type BudgetLineSummary = {
    id: string;
    code: string;
    title: string;
    category: CostCategory;
    parentId: string | null;

    plannedAmount: number;
    committedAmount: number;
    actualAmount: number;
};

function tone(type: "success" | "error") {
    return type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        : "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

// --- helpers (UI-only) ---
// Máx 2 niveles: 01 y 01.10
const RE_ROOT = /^\d{2}$/; // 01
const RE_CHILD = /^\d{2}\.\d{2}$/; // 01.10

function isRootCode(s: string) {
    return RE_ROOT.test(s);
}
function isChildCode(s: string) {
    return RE_CHILD.test(s);
}
function normalizeCode(s: string) {
    return (s ?? "").trim().replace(/\s+/g, "");
}
function parentPrefixFromCode(code: string) {
    // "04.10" -> "04"
    const m = /^(\d{2})\.\d{2}$/.exec(code);
    return m?.[1] ?? null;
}
function nextChildCode(parentCode: string, usedCodes: Set<string>) {
    // parentCode: "04"
    for (let i = 1; i <= 99; i++) {
        const child = `${parentCode}.${String(i).padStart(2, "0")}`;
        if (!usedCodes.has(child)) return child;
    }
    return `${parentCode}.01`;
}

export function ProjectBudgetClient({
    projectId,
    currencyCode,
    activeBudget,
    draftBudget,
    lines,
}: {
    projectId: string;
    currencyCode: string | null;
    activeBudget: BudgetHeaderPick | null; // último APPROVED
    draftBudget: BudgetHeaderPick | null; // último DRAFT (borrador de revisión)
    lines: BudgetLineSummary[]; // líneas del presupuesto “visible” (draft si existe, si no active)
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Política:
    // - Visible = draftBudget ?? activeBudget
    // - Editable SOLO si existe draftBudget (borrador)
    const visibleBudget = draftBudget ?? activeBudget;
    const isDraft = !!draftBudget;
    const editableBudgetId = draftBudget?.id ?? null;

    // Solo capítulos como parents (root = sin parentId)
    const parents = useMemo(() => lines.filter((l) => !l.parentId), [lines]);

    // Used codes para sugerencia
    const usedCodes = useMemo(() => new Set(lines.map((l) => l.code)), [lines]);

    // Conteo de hijos por parentId (para hasChildren y UI)
    const childrenCountByParent = useMemo(() => {
        const map = new Map<string, number>();
        for (const l of lines) {
            if (l.parentId) map.set(l.parentId, (map.get(l.parentId) ?? 0) + 1);
        }
        return map;
    }, [lines]);

    function hasChildren(lineId: string) {
        return (childrenCountByParent.get(lineId) ?? 0) > 0;
    }

    function money(n: number) {
        const code = currencyCode ?? "—";
        return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${code}`;
    }

    function setFlash(type: "success" | "error", text: string, ms = 1400) {
        setMsg({ type, text });
        window.setTimeout(() => setMsg(null), ms);
    }

    const canCreateBase = !activeBudget && !draftBudget;
    const canCreateDraft = !!activeBudget && !draftBudget;
    const canApproveDraft = !!draftBudget;
    const canEditLines = !!editableBudgetId;
    const showLineSection = !!visibleBudget;

    // --- Form state (controlado) ---
    const [code, setCode] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<CostCategory>(CostCategory.CONSTRUCTION);
    const [plannedAmount, setPlannedAmount] = useState("");
    const [parentId, setParentId] = useState<string>(""); // "" = sin parent

    const parentForSelect = parentId ? parents.find((p) => p.id === parentId) ?? null : null;

    const normCode = normalizeCode(code);
    const codeIsRoot = isRootCode(normCode);
    const codeIsChild = isChildCode(normCode);
    const codeLooksInvalid = normCode.length > 0 && !codeIsRoot && !codeIsChild;

    function syncParentFromCode(nextCode: string) {
        const c = normalizeCode(nextCode);

        if (isChildCode(c)) {
            const prefix = parentPrefixFromCode(c);
            if (!prefix) return;
            const foundParent = parents.find((p) => p.code === prefix);
            if (foundParent) setParentId(foundParent.id);
        } else if (isRootCode(c)) {
            setParentId("");
        }
    }

    function onChangeParent(nextParentId: string) {
        setParentId(nextParentId);

        if (!nextParentId) return;

        const p = parents.find((x) => x.id === nextParentId);
        if (!p) return;

        const c = normalizeCode(code);
        if (isChildCode(c) && c.startsWith(p.code + ".")) return;

        const suggestion = nextChildCode(p.code, usedCodes);
        setCode(suggestion);
    }

    function resetLineForm() {
        setCode("");
        setTitle("");
        setCategory(CostCategory.CONSTRUCTION);
        setPlannedAmount("");
        setParentId("");
    }

    async function submitCreateLine() {
        if (!editableBudgetId) {
            setFlash("error", "No hay un borrador activo para editar.");
            return;
        }

        const c = normalizeCode(code);

        if (!c) return setFlash("error", "Código requerido.");
        if (!title.trim()) return setFlash("error", "Título requerido.");
        if (codeLooksInvalid) return setFlash("error", 'Código inválido. Usa "01" o "01.10".');

        // coherencia parent/código (UI)
        if (isChildCode(c) && !parentId) {
            return setFlash("error", "Este código es sublínea (01.10). Debes elegir un capítulo (parent).");
        }
        if (isRootCode(c) && parentId) {
            return setFlash("error", 'Un capítulo (01) no puede tener parent. Limpia "(Sin parent)".');
        }

        if (parentId && parentForSelect) {
            if (!c.startsWith(parentForSelect.code + ".")) {
                return setFlash("error", `El código debe iniciar por "${parentForSelect.code}." (ej: ${parentForSelect.code}.10).`);
            }
        }

        const amt = plannedAmount.trim();
        if (!amt) return setFlash("error", "Monto requerido.");

        const fd = new FormData();
        fd.set("code", c);
        fd.set("title", title.trim());
        fd.set("category", String(category));
        fd.set("plannedAmount", amt);
        fd.set("parentId", parentId);

        startTransition(async () => {
            const res = await createBudgetLineAction(projectId, editableBudgetId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Línea creada.");
            resetLineForm();
            router.refresh();
        });
    }

    // --------- UI: armar estructura capítulo -> hijos (solo 2 niveles) ----------
    const { rootLines, childrenByRoot } = useMemo(() => {
        const roots = lines.filter((l) => !l.parentId).slice().sort((a, b) => a.code.localeCompare(b.code));
        const map = new Map<string, BudgetLineSummary[]>();
        for (const l of lines) {
            if (!l.parentId) continue;
            const arr = map.get(l.parentId) ?? [];
            arr.push(l);
            map.set(l.parentId, arr);
        }
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => a.code.localeCompare(b.code));
            map.set(k, arr);
        }
        return { rootLines: roots, childrenByRoot: map };
    }, [lines]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Presupuesto</h3>

                        {visibleBudget ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isDraft ? (
                                    <>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">Borrador de revisión</span> • v
                                        {visibleBudget.version} • {visibleBudget.status}
                                    </>
                                ) : (
                                    <>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">Activo</span> • v
                                        {visibleBudget.version} • {visibleBudget.status}
                                    </>
                                )}{" "}
                                • Moneda:{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{currencyCode ?? "—"}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aún no hay presupuesto para este proyecto.</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {msg && (
                            <span className={["text-[11px] px-2 py-1 rounded-full border", tone(msg.type)].join(" ")}>
                                {msg.text}
                            </span>
                        )}

                        {canCreateBase && (
                            <button
                                disabled={pending}
                                onClick={() => {
                                    setMsg(null);
                                    startTransition(async () => {
                                        const res = await createInitialBudgetAction(projectId);
                                        if (!res.ok) return setFlash("error", res.message);
                                        setFlash("success", "Presupuesto base creado (v1).");
                                        router.refresh();
                                    });
                                }}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                            >
                                {pending ? "Creando..." : "Crear presupuesto base (v1)"}
                            </button>
                        )}

                        {canCreateDraft && (
                            <button
                                disabled={pending}
                                onClick={() => {
                                    setMsg(null);
                                    startTransition(async () => {
                                        const res = await createNextBudgetVersionAction(projectId);
                                        if (!res.ok) return setFlash("error", res.message);
                                        setFlash("success", `Borrador creado (v${res.budget.version}).`);
                                        router.refresh();
                                    });
                                }}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 text-sm font-bold text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60 cursor-pointer"
                            >
                                {pending ? "Creando..." : "Crear borrador de revisión"}
                            </button>
                        )}

                        {canApproveDraft && (
                            <button
                                disabled={pending}
                                onClick={() => {
                                    if (!draftBudget) return;
                                    setMsg(null);
                                    startTransition(async () => {
                                        const res = await approveBudgetAction(projectId, draftBudget.id);
                                        if (!res.ok) return setFlash("error", res.message);
                                        setFlash("success", `Borrador aprobado (v${draftBudget.version}).`);
                                        router.refresh();
                                    });
                                }}
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-emerald-600/90 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 cursor-pointer"
                                title="Convierte el borrador en el presupuesto activo (APPROVED)"
                            >
                                {pending ? "Aprobando..." : "Aprobar borrador"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Create line */}
                <div className="p-5">
                    {!showLineSection ? (
                        <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-xs text-slate-500 dark:text-slate-400">
                            Crea el presupuesto base para poder agregar líneas.
                        </div>
                    ) : !canEditLines ? (
                        <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-xs text-slate-500 dark:text-slate-400">
                            Este presupuesto está <span className="font-semibold">aprobado</span>. Para editar líneas, crea un{" "}
                            <span className="font-semibold">borrador de revisión</span>.
                        </div>
                    ) : (
                        <form
                            className="grid grid-cols-1 md:grid-cols-6 gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setMsg(null);
                                submitCreateLine();
                            }}
                        >
                            {/* Código */}
                            <div className="md:col-span-1">
                                <input
                                    name="code"
                                    value={code}
                                    onChange={(e) => {
                                        const next = e.currentTarget.value;
                                        setCode(next);
                                        syncParentFromCode(next);
                                    }}
                                    placeholder='Código (01 o 01.10)'
                                    className={[
                                        "w-full bg-slate-50 dark:bg-slate-900/40 border rounded-lg px-4 py-2.5 text-sm focus:ring-1 outline-none",
                                        codeLooksInvalid ? "border-rose-500/30 focus:ring-rose-500" : "border-fuchsia-500/10 focus:ring-fuchsia-500",
                                    ].join(" ")}
                                />
                                {codeLooksInvalid ? <p className="mt-1 text-[11px] text-rose-300">Formato: "01" o "01.10"</p> : null}
                            </div>

                            {/* Título */}
                            <input
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.currentTarget.value)}
                                placeholder="Título (ej: Acabados)"
                                className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                            />

                            {/* Categoría */}
                            <select
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.currentTarget.value as CostCategory)}
                                className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                            >
                                {Object.values(CostCategory).map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            {/* Monto */}
                            <input
                                name="plannedAmount"
                                type="text"
                                inputMode="decimal"
                                value={plannedAmount}
                                onChange={(e) => setPlannedAmount(e.currentTarget.value)}
                                placeholder={`Monto (${currencyCode ?? "—"})`}
                                className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                title='Ej: 1250000 o 1250000.50 (usa "." para decimales)'
                            />

                            {/* Parent */}
                            <select
                                name="parentId"
                                value={parentId}
                                onChange={(e) => onChangeParent(e.currentTarget.value)}
                                className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                title="Opcional: cuelga esta línea de un capítulo"
                            >
                                <option value="">(Sin parent - Capítulo)</option>
                                {parents.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.code} • {p.title}
                                    </option>
                                ))}
                            </select>

                            {/* Hint */}
                            <div className="md:col-span-6 -mt-1">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Regla: capítulos <span className="font-semibold">01</span> (sin parent) y detalles{" "}
                                    <span className="font-semibold">01.10</span> (requieren parent del capítulo). Máx. 2 niveles.
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="md:col-span-6 flex justify-end">
                                <button
                                    disabled={pending}
                                    className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                                >
                                    {pending ? "Guardando..." : "Agregar línea"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Lines list (jerárquico) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/30 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Líneas presupuestales</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{lines.length}</span>
                </div>

                {lines.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                        Sin líneas. Agrega capítulos/líneas (01, 01.10, 02…) para poder registrar costos con trazabilidad.
                    </div>
                ) : (
                    <div className="divide-y divide-fuchsia-500/10">
                        {rootLines.map((root) => {
                            const rootChildren = childrenByRoot.get(root.id) ?? [];
                            const rootRemaining = root.plannedAmount - root.actualAmount;

                            const rootIsChapter = true; // root siempre es capítulo
                            const rootHasChildren = rootChildren.length > 0 || hasChildren(root.id);
                            const rootCanDelete = canEditLines && !rootHasChildren;
                            const rootDeleteTitle = !canEditLines
                                ? "Solo puedes eliminar líneas en borrador"
                                : rootHasChildren
                                    ? "No puedes eliminar un capítulo con sublíneas"
                                    : "Eliminar línea (solo DRAFT)";

                            return (
                                <div key={root.id} className="px-4 py-3 bg-slate-50/60 dark:bg-slate-950/15">
                                    {/* Root header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {root.code} • {root.title}
                                                </p>

                                                <span
                                                    className="text-[11px] px-2 py-0.5 rounded-full border border-slate-500/20 bg-slate-500/10 text-slate-200"
                                                    title="Capítulo: agrupa sublíneas"
                                                >
                                                    Capítulo
                                                </span>

                                                {rootChildren.length > 0 ? (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        • {rootChildren.length} detalle{rootChildren.length === 1 ? "" : "s"}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Categoría: {root.category}</p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{money(root.plannedAmount)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                        <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                            <span className="text-slate-500 dark:text-slate-400">Comprom.</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{money(root.committedAmount)}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                            <span className="text-slate-500 dark:text-slate-400">Ejecut.</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{money(root.actualAmount)}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                            <span className="text-slate-500 dark:text-slate-400">Remanente</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{money(rootRemaining)}</span>
                                        </div>
                                    </div>

                                    {/* Root actions */}
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            disabled={pending || !rootCanDelete}
                                            onClick={() => {
                                                if (!editableBudgetId) return;
                                                setMsg(null);
                                                startTransition(async () => {
                                                    const res = await deleteBudgetLineAction(projectId, editableBudgetId, root.id);
                                                    if (!res.ok) return setFlash("error", res.message);
                                                    setFlash("success", "Línea eliminada.");
                                                    router.refresh();
                                                });
                                            }}
                                            className={[
                                                "text-xs font-semibold px-3 py-1 rounded-md border transition",
                                                rootCanDelete
                                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                                                    : "border-slate-500/20 bg-slate-500/10 text-slate-400 cursor-not-allowed",
                                            ].join(" ")}
                                            title={rootDeleteTitle}
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    {/* Children block */}
                                    {rootChildren.length > 0 ? (
                                        <div className="mt-4 rounded-xl border border-fuchsia-500/10 bg-white/40 dark:bg-slate-950/10 overflow-hidden">
                                            <div className="px-4 py-2 border-b border-fuchsia-500/10 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                                                Detalles
                                            </div>

                                            <div className="divide-y divide-fuchsia-500/10">
                                                {rootChildren.map((l) => {
                                                    const remaining = l.plannedAmount - l.actualAmount;

                                                    const isChapter = hasChildren(l.id); // no debería pasar (2 niveles), pero lo dejamos por seguridad
                                                    const canDelete = canEditLines && !isChapter;
                                                    const deleteTitle = !canEditLines
                                                        ? "Solo puedes eliminar líneas en borrador"
                                                        : isChapter
                                                            ? "No puedes eliminar un capítulo con sublíneas"
                                                            : "Eliminar línea (solo DRAFT)";

                                                    return (
                                                        <div key={l.id} className="px-4 py-3">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                            {l.code} • {l.title}
                                                                        </p>

                                                                        <span
                                                                            className="text-[11px] px-2 py-0.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200"
                                                                            title="Detalle: línea imputable"
                                                                        >
                                                                            Detalle
                                                                        </span>
                                                                    </div>

                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                        Categoría: {l.category}
                                                                    </p>
                                                                </div>

                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                        {money(l.plannedAmount)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                                                <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                    <span className="text-slate-500 dark:text-slate-400">Comprom.</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                        {money(l.committedAmount)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                    <span className="text-slate-500 dark:text-slate-400">Ejecut.</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                        {money(l.actualAmount)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                    <span className="text-slate-500 dark:text-slate-400">Remanente</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                        {money(remaining)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    disabled={pending || !canDelete}
                                                                    onClick={() => {
                                                                        if (!editableBudgetId) return;
                                                                        setMsg(null);
                                                                        startTransition(async () => {
                                                                            const res = await deleteBudgetLineAction(projectId, editableBudgetId, l.id);
                                                                            if (!res.ok) return setFlash("error", res.message);
                                                                            setFlash("success", "Línea eliminada.");
                                                                            router.refresh();
                                                                        });
                                                                    }}
                                                                    className={[
                                                                        "text-xs font-semibold px-3 py-1 rounded-md border transition",
                                                                        canDelete
                                                                            ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                                                                            : "border-slate-500/20 bg-slate-500/10 text-slate-400 cursor-not-allowed",
                                                                    ].join(" ")}
                                                                    title={deleteTitle}
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}