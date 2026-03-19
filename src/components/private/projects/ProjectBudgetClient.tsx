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
import { BudgetStatus, CostCategory, CommitmentType, CostDocType, RevenueType } from "../../../../generated/prisma/enums";

import {
    getPostableBudgetLinesAction,
    listProjectCommitmentsAction,
    createProjectCommitmentAction,
    deleteProjectCommitmentAction,
    listProjectActualCostsAction,
    createProjectActualCostAction,
    deleteProjectActualCostAction,
    createProjectRevenueAction,
    listProjectRevenuesAction,
    deleteProjectRevenueAction
} from "@/action/projects/project-finance";

type BudgetTab = "plan" | "commitments" | "costs" | "revenues";

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

type PostableLine = {
    id: string;
    code: string;
    title: string;
    category: CostCategory;
};

type CommitmentItem = {
    id: string;
    type: CommitmentType;
    category: CostCategory;
    amount: number;
    currencyCode: string;
    budgetLineId: string;
    budgetLineCode: string;
    budgetLineTitle: string;
    partnerId: string | null;
    reference: string | null;
    occurredAt: Date | null;
    createdAt: Date;
};

type CostItem = {
    id: string;
    amount: number;
    currencyCode: string;
    budgetLineId: string;
    budgetLineCode: string;
    budgetLineTitle: string;
    docType: CostDocType | null;
    docNo: string | null;
    occurredAt: Date | null;
    createdAt: Date;
};

type RevenueRowUI = {
    id: string;
    type: RevenueType;
    amount: number;
    currencyCode: string;
    expectedAt: string | null; // serializable
    receivedAt: string | null; // serializable
    occurredAt: string | null; // serializable
    notes: string | null;
    createdAt: string; // serializable
};

export type TeamPartnerOption = {
    id: string;
    label: string;      // "BP-0001 • Hernan Oquendo"
    roleLabel?: string; // "Contratista"
    isPrimary?: boolean;
};

function tone(type: "success" | "error") {
    return type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200"
        : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-200";
}

// --- helpers (UI-only) ---
// Máx 2 niveles: 01 y 01.100
const RE_ROOT = /^\d{2}$/; // 01
const RE_CHILD = /^\d{2}\.\d{3}$/;

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
    const m = /^(\d{2})\.\d{3}$/.exec(code);
    return m?.[1] ?? null;
}
function nextChildCode(parentCode: string, usedCodes: Set<string>) {
    for (let i = 1; i <= 999; i++) {
        const child = `${parentCode}.${String(i).padStart(3, "0")}`;
        if (!usedCodes.has(child)) return child;
    }
    return `${parentCode}.001`;
}

function formatDate(d: Date | null | undefined) {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString("es-CO");
    } catch {
        return "—";
    }
}

export function ProjectBudgetClient({
    projectId,
    currencyCode,
    activeBudget,
    draftBudget,
    lines,
    teamPartners
}: {
    projectId: string;
    currencyCode: string | null;
    activeBudget: BudgetHeaderPick | null; // último APPROVED
    draftBudget: BudgetHeaderPick | null; // último DRAFT (borrador de revisión)
    lines: BudgetLineSummary[]; // líneas del presupuesto “visible” (draft si existe, si no active)
    teamPartners?: TeamPartnerOption[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [tab, setTab] = useState<BudgetTab>("plan");

    // Política:
    // - Visible = draftBudget ?? activeBudget
    // - Editable SOLO si existe draftBudget (borrador)
    const visibleBudget = draftBudget ?? activeBudget;
    const isDraft = !!draftBudget;
    const editableBudgetId = draftBudget?.id ?? null;

    // Partners
    // const partners = teamPartners ?? [];

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

    function setFlash(type: "success" | "error", text: string, ms = 3000) {
        setMsg({ type, text });
        window.setTimeout(() => setMsg(null), ms);
    }

    // --- Partners ---
    function partnerOptionLabel(p: TeamPartnerOption) {
        return p.isPrimary ? `${p.label} • PRIMARY` : p.label;
    }
    // -------- Partners (Team) ----------
    const partnerOptions = useMemo(() => teamPartners ?? [], [teamPartners]);

    // Commitment form
    const [commitPartnerId, setCommitPartnerId] = useState<string>("");

    // Cost form
    const [costPartnerId, setCostPartnerId] = useState<string>("");

    const canCreateBase = !activeBudget && !draftBudget;
    const canCreateDraft = !!activeBudget && !draftBudget;
    const canApproveDraft = !!draftBudget;
    const canEditLines = !!editableBudgetId;
    const showLineSection = !!visibleBudget;

    // ---- regla SAP-like para movimientos ----
    const hasApproved = !!activeBudget;
    const movementsAllowed = hasApproved;

    // --- Form state (PLAN) ---
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
        const isRoot = isRootCode(c);
        const isChild = isChildCode(c);
        const looksInvalid = c.length > 0 && !isRoot && !isChild;

        if (!c) return setFlash("error", "Código requerido.");
        if (!title.trim()) return setFlash("error", "Título requerido.");
        if (looksInvalid) {
            return setFlash("error", 'Código inválido. Usa "01", "01.10" o "01.100".');
        }

        if (isChild && !parentId) {
            return setFlash("error", 'Este código es sublínea (01.10 o 01.100). Debes elegir un capítulo (parent).');
        }

        if (isRoot && parentId) {
            return setFlash("error", 'Un capítulo (01) no puede tener parent. Limpia "(Sin parent)".');
        }

        if (parentId && parentForSelect) {
            if (!c.startsWith(parentForSelect.code + ".")) {
                return setFlash(
                    "error",
                    `El código debe iniciar por "${parentForSelect.code}." (ej: ${parentForSelect.code}.010 o ${parentForSelect.code}.100).`
                );
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
        const roots = lines
            .filter((l) => !l.parentId)
            .slice()
            .sort((a, b) => a.code.localeCompare(b.code));

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

    // ----------------- MOVIMIENTOS: estados -----------------
    const [postableLines, setPostableLines] = useState<PostableLine[]>([]);
    const [loadedPostable, setLoadedPostable] = useState(false);

    const [commitments, setCommitments] = useState<CommitmentItem[]>([]);
    const [loadedCommitments, setLoadedCommitments] = useState(false);
    const [loadingCommitments, setLoadingCommitments] = useState(false);

    const [costs, setCosts] = useState<CostItem[]>([]);
    const [loadedCosts, setLoadedCosts] = useState(false);
    const [loadingCosts, setLoadingCosts] = useState(false);

    async function ensurePostableLines() {
        if (loadedPostable) return;
        if (!movementsAllowed) return;

        const res = await getPostableBudgetLinesAction(projectId);
        if (!res.ok) {
            setFlash("error", res.message);
            return;
        }
        setPostableLines(res.lines as any);
        setLoadedPostable(true);
    }

    async function loadCommitments() {
        if (!movementsAllowed) return;
        setLoadingCommitments(true);
        try {
            const res = await listProjectCommitmentsAction(projectId);
            if (!res.ok) {
                setFlash("error", "No se pudieron cargar compromisos.");
                return;
            }
            setCommitments(res.items as any);
            setLoadedCommitments(true);
        } finally {
            setLoadingCommitments(false);
        }
    }

    async function loadCosts() {
        if (!movementsAllowed) return;
        setLoadingCosts(true);
        try {
            const res = await listProjectActualCostsAction(projectId);
            if (!res.ok) {
                setFlash("error", "No se pudieron cargar gastos.");
                return;
            }
            setCosts(res.items as any);
            setLoadedCosts(true);
        } finally {
            setLoadingCosts(false);
        }
    }

    function switchTab(next: BudgetTab) {
        setTab(next);
        // precarga inteligente
        if (next === "commitments") {
            ensurePostableLines();
            if (!loadedCommitments) loadCommitments();
        }
        if (next === "costs") {
            ensurePostableLines();
            if (!loadedCosts) loadCosts();
        }
        if (next === "revenues") {
            if (!loadedRevenues) loadRevenues();
        }
    }

    // ----------------- FORM: Commitments -----------------
    const [cmtLineId, setCmtLineId] = useState<string>("");
    const [cmtType, setCmtType] = useState<CommitmentType>(CommitmentType.QUOTE);
    const [cmtAmount, setCmtAmount] = useState<string>("");
    // const [cmtPartnerId, setCmtPartnerId] = useState<string>("");
    const [cmtReference, setCmtReference] = useState<string>("");
    const [cmtOccurredAt, setCmtOccurredAt] = useState<string>("");
    const [cmtNotes, setCmtNotes] = useState<string>("");

    function resetCommitmentForm() {
        setCmtLineId("");
        setCmtType(CommitmentType.QUOTE);
        setCmtAmount("");
        // setCmtPartnerId("");
        setCmtReference("");
        setCmtOccurredAt("");
        setCmtNotes("");
    }

    function submitCreateCommitment() {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");
        if (!cmtLineId) return setFlash("error", "Selecciona una línea de detalle.");
        const amt = Number(String(cmtAmount).trim());
        if (!Number.isFinite(amt) || amt <= 0) return setFlash("error", "Monto inválido.");

        const fd = new FormData();
        fd.set("budgetLineId", cmtLineId);
        fd.set("type", String(cmtType));
        fd.set("amount", String(cmtAmount).trim());
        if (commitPartnerId) fd.set("partnerId", commitPartnerId.trim());
        if (cmtReference.trim()) fd.set("reference", cmtReference.trim());
        if (cmtOccurredAt.trim()) fd.set("occurredAt", cmtOccurredAt.trim());
        if (cmtNotes.trim()) fd.set("notes", cmtNotes.trim());

        startTransition(async () => {
            const res = await createProjectCommitmentAction(projectId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Compromiso creado.");
            resetCommitmentForm();
            await loadCommitments();
            router.refresh(); // para KPIs/plan vs comprometido
        });
    }

    async function deleteCommitment(commitmentId: string) {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");

        startTransition(async () => {
            const res = await deleteProjectCommitmentAction(projectId, commitmentId);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Compromiso eliminado.");
            await loadCommitments(); // ✅ recarga tab
            router.refresh(); // ✅ KPIs
        });
    }

    // ----------------- FORM: Costs -----------------
    const [costLineId, setCostLineId] = useState<string>("");
    const [costAmount, setCostAmount] = useState<string>("");
    const [costDocType, setCostDocType] = useState<string>(""); // "" = null
    const [costDocNo, setCostDocNo] = useState<string>("");
    const [costOccurredAt, setCostOccurredAt] = useState<string>("");
    const [costNotes, setCostNotes] = useState<string>("");

    function resetCostForm() {
        setCostLineId("");
        setCostAmount("");
        setCostDocType("");
        setCostDocNo("");
        setCostOccurredAt("");
        setCostNotes("");
    }

    function submitCreateCost() {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");
        if (!costLineId) return setFlash("error", "Selecciona una línea de detalle.");
        const amt = Number(String(costAmount).trim());
        if (!Number.isFinite(amt) || amt <= 0) return setFlash("error", "Monto inválido.");

        const fd = new FormData();
        fd.set("budgetLineId", costLineId);
        fd.set("amount", String(costAmount).trim());
        if (costDocType.trim()) fd.set("docType", costDocType.trim());
        if (costPartnerId) fd.set("partnerId", costPartnerId.trim());
        if (costDocNo.trim()) fd.set("docNo", costDocNo.trim());
        if (costOccurredAt.trim()) fd.set("occurredAt", costOccurredAt.trim());
        if (costNotes.trim()) fd.set("notes", costNotes.trim());

        startTransition(async () => {
            const res = await createProjectActualCostAction(projectId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Gasto registrado.");
            resetCostForm();
            await loadCosts();
            router.refresh(); // para KPIs/plan vs ejecutado
        });
    }

    async function deleteCost(costId: string) {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");

        startTransition(async () => {
            const res = await deleteProjectActualCostAction(projectId, costId);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Gasto eliminado.");
            await loadCosts();
            router.refresh(); // KPIs
        });
    }

    // ----------------- FORM: revenues -----------------
    const [revType, setRevType] = useState<RevenueType>(RevenueType.SALE);
    const [revAmount, setRevAmount] = useState("");
    const [revExpectedAt, setRevExpectedAt] = useState(""); // "YYYY-MM-DD"
    const [revReceivedAt, setRevReceivedAt] = useState(""); // "YYYY-MM-DD"
    const [revNotes, setRevNotes] = useState("");

    const [revenues, setRevenues] = useState<RevenueRowUI[]>([]);
    const [loadedRevenues, setLoadedRevenues] = useState(false);

    function resetRevenueForm() {
        setRevType(RevenueType.SALE);
        setRevAmount("");
        setRevExpectedAt("");
        setRevReceivedAt("");
        setRevNotes("");
    }

    async function loadRevenues() {
        const res = await listProjectRevenuesAction(projectId);
        if (!res.ok) {
            setFlash("error", "No se pudieron cargar ingresos.");
            return;
        }
        setRevenues(res.rows);
        setLoadedRevenues(true);
    }

    function submitCreateRevenue() {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");

        const amt = Number(String(revAmount).trim());
        if (!Number.isFinite(amt) || amt <= 0) return setFlash("error", "Monto inválido.");

        // Validaciones de fechas (opcionales pero sanas)
        const expected = revExpectedAt.trim();
        const received = revReceivedAt.trim();

        // si el usuario pone received y no expected: está bien
        // si pone ambas, opcionalmente validamos orden (received >= expected)
        if (expected && received) {
            const dExp = new Date(expected);
            const dRec = new Date(received);
            if (!Number.isFinite(dExp.getTime())) return setFlash("error", "Fecha esperada inválida.");
            if (!Number.isFinite(dRec.getTime())) return setFlash("error", "Fecha recibida inválida.");
            if (dRec.getTime() < dExp.getTime()) return setFlash("error", "La fecha recibida no puede ser menor que la esperada.");
        } else {
            if (expected) {
                const dExp = new Date(expected);
                if (!Number.isFinite(dExp.getTime())) return setFlash("error", "Fecha esperada inválida.");
            }
            if (received) {
                const dRec = new Date(received);
                if (!Number.isFinite(dRec.getTime())) return setFlash("error", "Fecha recibida inválida.");
            }
        }

        const fd = new FormData();
        fd.set("type", String(revType));
        fd.set("amount", String(revAmount).trim());
        if (expected) fd.set("expectedAt", expected);
        if (received) fd.set("receivedAt", received);
        if (revNotes.trim()) fd.set("notes", revNotes.trim());

        startTransition(async () => {
            const res = await createProjectRevenueAction(projectId, fd);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Ingreso registrado.");
            resetRevenueForm();
            await loadRevenues();
            router.refresh(); // ✅ KPIs/ingresos totales arriba
        });
    }

    async function deleteRevenue(revenueId: string) {
        if (!movementsAllowed) return setFlash("error", "No hay presupuesto aprobado (APPROVED).");

        startTransition(async () => {
            const res = await deleteProjectRevenueAction(projectId, revenueId);
            if (!res.ok) return setFlash("error", res.message);

            setFlash("success", "Ingreso eliminado.");
            await loadRevenues();
            router.refresh(); // KPIs
        });
    }

    // Select de partners
    function PartnerSelect({
        value,
        onChange,
        disabled,
    }: {
        value: string;
        onChange: (v: string) => void;
        disabled?: boolean;
    }) {
        return (
            <select
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                disabled={disabled}
                className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none disabled:opacity-60"
                title="Opcional: tercero (BP) asociado al movimiento"
            >
                <option value="">(Opcional) Sin tercero</option>

                {partnerOptions.length === 0 ? (
                    <option value="" disabled>
                        No hay terceros asignados al team del proyecto
                    </option>
                ) : (
                    partnerOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                            {partnerOptionLabel(p)}
                        </option>
                    ))
                )}
            </select>
        );
    }

    // ---------------------------------------------
    // RENDER
    // ---------------------------------------------
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
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">Activo</span> • v{visibleBudget.version} •{" "}
                                        {visibleBudget.status}
                                    </>
                                )}{" "}
                                • Moneda: <span className="font-semibold text-slate-800 dark:text-slate-100">{currencyCode ?? "—"}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aún no hay presupuesto para este proyecto.</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {msg && <span className={["text-[11px] px-2 py-1 rounded-full border", tone(msg.type)].join(" ")}>{msg.text}</span>}

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
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 text-sm font-bold text-fuchsia-600 dark:text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60 cursor-pointer"
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
                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-emerald-600/90 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                                title="Convierte el borrador en el presupuesto activo (APPROVED)"
                            >
                                {pending ? "Aprobando..." : "Aprobar borrador"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Banner movimientos */}
                <div className="px-5 pt-4">
                    {!movementsAllowed ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-200">
                            No puedes registrar movimientos (compromisos/gastos) hasta que exista un presupuesto <b>APPROVED</b>.
                        </div>
                    ) : draftBudget ? (
                        <div className="rounded-xl border border-slate-500/20 bg-slate-500/10 p-3 text-xs text-slate-700 dark:text-slate-200">
                            Existe un borrador <b>v{draftBudget.version}</b>. Los movimientos se registran únicamente en el presupuesto activo{" "}
                            <b>v{activeBudget?.version}</b>.
                        </div>
                    ) : null}
                    {partnerOptions.length === 0 ? (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-200">
                            Tip: Asigna terceros al <b>Equipo (BP)</b> del proyecto para que aparezcan aquí como opciones.
                        </div>
                    ) : null}
                </div>

                {/* Tabs */}
                <div className="px-5 py-4">
                    <div className="flex gap-2">
                        {[
                            { k: "plan", label: "Plan" },
                            { k: "commitments", label: "Compromisos" },
                            { k: "costs", label: "Ejecución (Gastos)" },
                            { k: "revenues", label: "Ingresos" },
                        ].map((x) => (
                            <button
                                key={x.k}
                                type="button"
                                onClick={() => switchTab(x.k as BudgetTab)}
                                className={[
                                    "px-3 py-1.5 rounded-md text-xs font-bold border transition cursor-pointer",
                                    tab === x.k
                                        ? "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-200"
                                        : "border-fuchsia-500/10 bg-slate-950/10 text-slate-700 dark:text-slate-300 hover:bg-slate-950/20",
                                ].join(" ")}
                            >
                                {x.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <div className="px-5 pb-5">
                    {tab === "plan" ? (
                        <>
                            {/* Create line */}
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
                                            autoComplete="false"
                                            placeholder='Código (01 o 01.100)'
                                            className={[
                                                "w-full bg-slate-50 dark:bg-slate-900/40 border rounded-lg px-4 py-2.5 text-sm focus:ring-1 outline-none",
                                                codeLooksInvalid ? "border-rose-500/30 focus:ring-rose-500" : "border-fuchsia-500/10 focus:ring-fuchsia-500",
                                            ].join(" ")}
                                        />
                                        {codeLooksInvalid ? <p className="mt-1 text-[11px] text-rose-300">Formato: "01" o "01.100"</p> : null}
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
                                            <span className="font-semibold">01.100</span> (requieren parent del capítulo). Máx. 2 niveles.
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
                        </>
                    ) : tab === "commitments" ? (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Registrar compromiso</p>
                                    <button
                                        type="button"
                                        disabled={pending || !movementsAllowed}
                                        onClick={() => {
                                            ensurePostableLines();
                                            loadCommitments();
                                        }}
                                        className="text-xs font-bold px-3 py-1.5 rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60"
                                    >
                                        {loadingCommitments ? "Cargando..." : "Refrescar"}
                                    </button>
                                </div>

                                {!movementsAllowed ? (
                                    <p className="mt-2 text-xs text-slate-400">Bloqueado: no hay presupuesto aprobado.</p>
                                ) : (
                                    <form
                                        className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setMsg(null);
                                            submitCreateCommitment();
                                        }}
                                    >
                                        <select
                                            value={cmtLineId}
                                            onChange={(e) => setCmtLineId(e.currentTarget.value)}
                                            className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        >
                                            <option value="">Selecciona línea (detalle)</option>
                                            {postableLines.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.code} • {l.title}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={cmtType}
                                            onChange={(e) => setCmtType(e.currentTarget.value as CommitmentType)}
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        >
                                            {Object.values(CommitmentType).map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            value={cmtAmount}
                                            onChange={(e) => setCmtAmount(e.currentTarget.value)}
                                            placeholder={`Monto (${currencyCode ?? "—"})`}
                                            inputMode="decimal"
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        />

                                        <select
                                            value={cmtReference}
                                            onChange={(e) => setCmtReference(e.currentTarget.value)}
                                            className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        >
                                            <option value="">Referencia (cotización/OC/contrato)</option>
                                            <option value="QUOTE">COTIZACION</option>
                                            <option value="PURCHASE_ORDER">ORDEN DE COMPRA</option>
                                            <option value="CONTRACT">CONTRATO</option>
                                            <option value="OTHER">OTRO</option>
                                        </select>

                                        <PartnerSelect
                                            value={commitPartnerId}
                                            onChange={setCommitPartnerId}
                                            disabled={pending || !movementsAllowed}
                                        />

                                        <input
                                            type="date"
                                            value={cmtOccurredAt}
                                            onChange={(e) => setCmtOccurredAt(e.currentTarget.value)}
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                            title="Fecha del compromiso"
                                        />

                                        <input
                                            value={cmtNotes}
                                            onChange={(e) => setCmtNotes(e.currentTarget.value)}
                                            placeholder="Notas (opcional)"
                                            className="md:col-span-3 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        />

                                        <div className="md:col-span-6 flex justify-end">
                                            <button
                                                disabled={pending || !movementsAllowed}
                                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                                            >
                                                {pending ? "Guardando..." : "Crear compromiso"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="rounded-xl border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/10 overflow-hidden">
                                <div className="px-4 py-3 border-b border-fuchsia-500/10 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Compromisos</p>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{commitments.length}</span>
                                </div>

                                {!movementsAllowed ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Bloqueado: no hay presupuesto aprobado.</div>
                                ) : loadingCommitments && !loadedCommitments ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Cargando...</div>
                                ) : commitments.length === 0 ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Sin compromisos.</div>
                                ) : (
                                    <div className="divide-y divide-fuchsia-500/10">
                                        {commitments.map((c) => (
                                            <div key={c.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {c.budgetLineCode} • {c.budgetLineTitle}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {c.type} • {c.reference ?? "—"} • {formatDate(c.occurredAt)}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            disabled={pending || !movementsAllowed}
                                                            onClick={() => {
                                                                if (!confirm("¿Eliminar compromiso?")) return;
                                                                deleteCommitment(c.id);
                                                            }}
                                                            className={[
                                                                "text-xs font-semibold px-3 py-1 rounded-md border transition mt-3",
                                                                movementsAllowed
                                                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                                                                    : "border-slate-500/20 bg-slate-500/10 text-slate-400 cursor-not-allowed",
                                                            ].join(" ")}
                                                            title={!movementsAllowed ? "No hay presupuesto aprobado (APPROVED)" : "Eliminar compromiso"}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Monto</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{money(c.amount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : tab === "costs" ? (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Registrar gasto (ejecutado)</p>
                                    <button
                                        type="button"
                                        disabled={pending || !movementsAllowed}
                                        onClick={() => {
                                            ensurePostableLines();
                                            loadCosts();
                                        }}
                                        className="text-xs font-bold px-3 py-1.5 rounded-md border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15 disabled:opacity-60"
                                    >
                                        {loadingCosts ? "Cargando..." : "Refrescar"}
                                    </button>
                                </div>

                                {!movementsAllowed ? (
                                    <p className="mt-2 text-xs text-slate-400">Bloqueado: no hay presupuesto aprobado.</p>
                                ) : (
                                    <form
                                        className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setMsg(null);
                                            submitCreateCost();
                                        }}
                                    >
                                        <select
                                            value={costLineId}
                                            onChange={(e) => setCostLineId(e.currentTarget.value)}
                                            className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        >
                                            <option value="">Selecciona línea (detalle)</option>
                                            {postableLines.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.code} • {l.title}
                                                </option>
                                            ))}
                                        </select>

                                        <PartnerSelect
                                            value={costPartnerId}
                                            onChange={setCostPartnerId}
                                            disabled={pending || !movementsAllowed}
                                        />

                                        <input
                                            value={costAmount}
                                            onChange={(e) => setCostAmount(e.currentTarget.value)}
                                            placeholder={`Monto (${currencyCode ?? "—"})`}
                                            inputMode="decimal"
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        />

                                        <select
                                            value={costDocType}
                                            onChange={(e) => setCostDocType(e.currentTarget.value)}
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                            title="Tipo de documento (opcional)"
                                        >
                                            <option value="">DocType (opcional)</option>
                                            {Object.values(CostDocType).map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            value={costDocNo}
                                            onChange={(e) => setCostDocNo(e.currentTarget.value)}
                                            placeholder="Doc No. (opcional)"
                                            className="md:col-span-1 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        />

                                        <input
                                            type="date"
                                            value={costOccurredAt}
                                            onChange={(e) => setCostOccurredAt(e.currentTarget.value)}
                                            className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                            title="Fecha del gasto"
                                        />

                                        {/* <input
                                            value={costNotes}
                                            onChange={(e) => setCostNotes(e.currentTarget.value)}
                                            placeholder="Notas (opcional)"
                                            className="md:col-span-3 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        /> */}
                                        <textarea
                                            value={costNotes}
                                            onChange={(e) => setCostNotes(e.currentTarget.value)}
                                            placeholder="Notas (opcional)"
                                            rows={3}
                                            className="md:col-span-5 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        ></textarea>

                                        <div className="md:col-span-6 flex justify-end">
                                            <button
                                                disabled={pending || !movementsAllowed}
                                                className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                                            >
                                                {pending ? "Guardando..." : "Registrar gasto"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="rounded-xl border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/10 overflow-hidden">
                                <div className="px-4 py-3 border-b border-fuchsia-500/10 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Gastos (Ejecutado)</p>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{costs.length}</span>
                                </div>

                                {!movementsAllowed ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Bloqueado: no hay presupuesto aprobado.</div>
                                ) : loadingCosts && !loadedCosts ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Cargando...</div>
                                ) : costs.length === 0 ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Sin gastos registrados.</div>
                                ) : (
                                    <div className="divide-y divide-fuchsia-500/10">
                                        {costs.map((c) => (
                                            <div key={c.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {c.budgetLineCode} • {c.budgetLineTitle}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {c.docType ?? "—"} • {c.docNo ?? "—"} • {formatDate(c.occurredAt)}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            disabled={pending || !movementsAllowed}
                                                            onClick={() => {
                                                                if (!confirm("¿Eliminar gasto?")) return;
                                                                deleteCost(c.id);
                                                            }}
                                                            className={[
                                                                "text-xs font-semibold px-3 py-1 rounded-md border transition mt-3",
                                                                movementsAllowed
                                                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                                                                    : "border-slate-500/20 bg-slate-500/10 text-slate-400 cursor-not-allowed",
                                                            ].join(" ")}
                                                            title={!movementsAllowed ? "No hay presupuesto aprobado (APPROVED)" : "Eliminar gasto"}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Monto</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{money(c.amount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 space-y-4">
                            {!movementsAllowed ? (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-200">
                                    No puedes registrar ingresos hasta que exista un presupuesto <b>APPROVED</b>.
                                </div>
                            ) : (
                                <form
                                    className="grid grid-cols-1 md:grid-cols-6 gap-3"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setMsg(null);
                                        submitCreateRevenue();
                                    }}
                                >
                                    <select
                                        value={revType}
                                        onChange={(e) => setRevType(e.currentTarget.value as RevenueType)}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                    >
                                        {Object.values(RevenueType).map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        value={revAmount}
                                        onChange={(e) => setRevAmount(e.currentTarget.value)}
                                        placeholder={`Monto (${currencyCode ?? "—"})`}
                                        className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                    />

                                    <input
                                        type="date"
                                        value={revExpectedAt}
                                        onChange={(e) => setRevExpectedAt(e.currentTarget.value)}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        title="Fecha esperada"
                                    />

                                    <input
                                        type="date"
                                        value={revReceivedAt}
                                        onChange={(e) => setRevReceivedAt(e.currentTarget.value)}
                                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                        title="Fecha recibida"
                                    />

                                    <input
                                        value={revNotes}
                                        onChange={(e) => setRevNotes(e.currentTarget.value)}
                                        placeholder="Notas (opcional)"
                                        className="md:col-span-4 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                    />

                                    <div className="md:col-span-6 flex justify-end">
                                        <button
                                            disabled={pending}
                                            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60 cursor-pointer"
                                        >
                                            {pending ? "Guardando..." : "Registrar ingreso"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Listado simple */}
                            <div className="rounded-xl border border-fuchsia-500/10 overflow-hidden">
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-500/5 border-b border-fuchsia-500/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Ingresos registrados ({revenues.length})
                                </div>

                                {revenues.length === 0 ? (
                                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Sin ingresos.</div>
                                ) : (
                                    <div className="divide-y divide-fuchsia-500/10">
                                        {revenues.map((r) => (
                                            <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {r.type} • {money(r.amount)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        Esperado: {r.expectedAt ? new Date(r.expectedAt).toLocaleDateString("es-CO") : "—"} • Recibido:{" "}
                                                        {r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("es-CO") : "—"}
                                                    </p>
                                                    {r.notes ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{r.notes}</p> : null}
                                                    <button
                                                        type="button"
                                                        disabled={pending || !movementsAllowed}
                                                        onClick={() => {
                                                            if (!confirm("¿Eliminar ingreso?")) return;
                                                            deleteRevenue(r.id);
                                                        }}
                                                        className={[
                                                            "text-xs font-semibold px-3 py-1 rounded-md border transition mt-3",
                                                            movementsAllowed
                                                                ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                                                                : "border-slate-500/20 bg-slate-500/10 text-slate-400 cursor-not-allowed",
                                                        ].join(" ")}
                                                        title={!movementsAllowed ? "No hay presupuesto aprobado (APPROVED)" : "Eliminar ingreso"}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                                <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(r.createdAt).toLocaleDateString("es-CO")}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PLAN: lista de líneas solo cuando tab=plan */}
            {tab === "plan" ? (
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
                                                        className="text-[11px] px-2 py-0.5 rounded-full border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-200"
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

                                                        const isChapter = hasChildren(l.id); // safety
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
                                                                                className="text-[11px] px-2 py-0.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-200"
                                                                                title="Detalle: línea imputable"
                                                                            >
                                                                                Detalle
                                                                            </span>
                                                                        </div>

                                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Categoría: {l.category}</p>
                                                                    </div>

                                                                    <div className="shrink-0 text-right">
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                                                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{money(l.plannedAmount)}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                                                    <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                        <span className="text-slate-500 dark:text-slate-400">Comprom.</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{money(l.committedAmount)}</span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                        <span className="text-slate-500 dark:text-slate-400">Ejecut.</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{money(l.actualAmount)}</span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/10 bg-white/60 dark:bg-slate-950/20 px-3 py-2">
                                                                        <span className="text-slate-500 dark:text-slate-400">Remanente</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{money(remaining)}</span>
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
            ) : null}
        </div>
    );
}