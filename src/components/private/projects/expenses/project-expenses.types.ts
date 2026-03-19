import { ProjectExpenseStatus } from "../../../../../generated/prisma/enums";

export type ProjectExpenseListRow = {
    id: string;
    status: ProjectExpenseStatus;
    partnerId: string | null;
    partnerName: string | null;
    docType: string | null;
    docNo: string | null;
    docDate: string | null;
    occurredAt: string | null;
    currencyCode: string;
    totalAmount: number;
    itemsCount: number;
    allocatedAmount: number;
    pendingAmount: number;
    isApproved: boolean;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ProjectExpenseFiltersState = {
    q: string;
    status: ProjectExpenseStatus | "";
    dateFrom: string;
    dateTo: string;
};