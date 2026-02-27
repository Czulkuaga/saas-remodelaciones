import type { PartnerType } from "../../../generated/prisma/client"; // o donde tengas el enum

export type BusinessPartnerListItem = {
    id: string;
    code: string;
    displayName: string;
    type: PartnerType;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    projectsCount: number;
    createdAt: Date;
};

export type BusinessPartnerKpisDTO = {
    total: number;
    active: number;
    organizations: number;
    persons: number;
};

export type BusinessPartnerListResponse = {
    items: BusinessPartnerListItem[];
    total: number;
    page: number;
    pageSize: number;
};