"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listProjectExpensesAction } from "@/action/projects/list-project-expenses.action";
import { ProjectExpenseFiltersState, ProjectExpenseListRow } from "./project-expenses.types";
import { ProjectExpensesToolbar } from "./ProjectExpensesToolbar";
import { ProjectExpensesStats } from "./ProjectExpensesStats";
import { ProjectExpensesFilters } from "./ProjectExpensesFilters";
import { ProjectExpensesList } from "./ProjectExpensesList";
import { ProjectExpenseCreateModal } from "./ProjectExpenseCreateModal";
import { ProjectExpenseCreateForm } from "./ProjectExpenseCreateForm";
import { ProjectPartnerRole } from "../../../../../generated/prisma/enums";

export type TeamPartnerOption = {
    id: string;
    label: string;
    roleLabel?: string;
    isPrimary?: boolean;
};

const INITIAL_FILTERS: ProjectExpenseFiltersState = {
    q: "",
    status: "",
    dateFrom: "",
    dateTo: "",
};

export function ProjectExpensesClient({
    projectId,
    currencyCode,
    teamPartners,
}: {
    projectId: string;
    currencyCode: string | null;
    teamPartners?: TeamPartnerOption[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [rows, setRows] = useState<ProjectExpenseListRow[]>([]);
    const [filters, setFilters] = useState<ProjectExpenseFiltersState>(INITIAL_FILTERS);
    const [openCreate, setOpenCreate] = useState(false);

    function load(nextFilters = filters) {
        startTransition(async () => {
            const res = await listProjectExpensesAction(projectId, nextFilters);
            if (!res.ok) return;
            setRows(res.rows);
        });
    }

    useEffect(() => {
        load(INITIAL_FILTERS);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const statsRows = useMemo(() => rows, [rows]);

    return (
        <>
            <div className="space-y-4">
                <div className="rounded-xl border border-fuchsia-500/10 bg-white dark:bg-slate-950/5 p-4 md:p-5">
                    <ProjectExpensesToolbar
                        onCreate={() => setOpenCreate(true)}
                        onUpload={() => {
                            console.log("Cargar factura");
                        }}
                    />

                    <div className="mt-4">
                        <ProjectExpensesStats rows={statsRows} currencyCode={currencyCode} />
                    </div>

                    <div className="mt-4">
                        <ProjectExpensesFilters
                            filters={filters}
                            onChange={setFilters}
                            onSubmit={() => load(filters)}
                            onReset={() => {
                                setFilters(INITIAL_FILTERS);
                                load(INITIAL_FILTERS);
                            }}
                            pending={pending}
                        />
                    </div>

                    <div className="mt-4">
                        <ProjectExpensesList
                            rows={rows}
                            currencyCode={currencyCode}
                            onCreate={() => setOpenCreate(true)}
                            onOpen={(expenseId) => {
                                router.push(`/projects/${projectId}/expenses/${expenseId}`);
                            }}
                        />
                    </div>
                </div>
            </div>

            <ProjectExpenseCreateModal
                open={openCreate}
                title="Nuevo gasto"
                subtitle="Crea el documento base del gasto real. Luego podrás agregar ítems y asignarlos al presupuesto."
                onClose={() => setOpenCreate(false)}
            >
                <ProjectExpenseCreateForm
                    projectId={projectId}
                    currencyCode={currencyCode}
                    teamPartners={teamPartners}
                    onCancel={() => setOpenCreate(false)}
                    onCreated={(expenseId) => {
                        setOpenCreate(false);
                        load();
                        router.push(`/projects/${projectId}/expenses/${expenseId}`);
                    }}
                />
            </ProjectExpenseCreateModal>
        </>
    );
}