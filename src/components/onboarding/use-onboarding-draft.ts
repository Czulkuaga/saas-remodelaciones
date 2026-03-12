"use client";

import { useEffect, useState } from "react";

export type OnboardingDraft = {
    organization: {
        legalName: string;
        displayName: string;
        slug: string;
        code: string;
        primaryCountry: string;
        defaultCurrency: string;
        defaultTimeZone: string;
        defaultLocale: string;
    };
    branding: {
        brandName: string;
        logoDarkUrl: string;
        logoLightUrl: string;
        logoIconUrl: string;
        primaryColor: string;
        secondaryColor: string;
        useDefaultBranding: boolean;
    };
    regional: {
        baseCountry: string;
        systemLanguage: string;
        operatingTimeZone: string;
        defaultCurrency: string;
        dateFormat: string;
        weekStartsOn: "SUNDAY" | "MONDAY";
    };
    structure: {
        orgUnitName: string;
        orgUnitType: string;
        locationName: string;
        addressLine1: string;
        city: string;
        postalCode: string;
        countryCode: string;
        timeZone: string;
    };
    businessPartner: {
        personType: "ORGANIZATION" | "INDIVIDUAL",
        legalName: string,
        tradeName: string,
        firstName: string,
        lastName: string,
        identifierType: string,
        identifierValue: string,
        mainContactName: string,
        email: string,
        phone: string,
        locationRelationType: "REGISTERED_OFFICE" | "TRADING_FACILITY" | "MAILING_ADDRESS",
        roleKey: string,
    },
    adminUser: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        preferredLanguage: string;
        setupPasswordNow: boolean;
        password: string;
        membershipRoleKey: string;
    };
    roles: {
        preset: "STANDARD" | "ENTERPRISE_CORE" | "MINIMAL";
        adminAssignedRoleKey: string;
        roles: Array<{
            key: string;
            name: string;
            description: string;
            isSystem: boolean;
            permissions: string[];
        }>;
    };
    numberRanges: {
        ranges: Array<{
            entity: string;
            prefix: string;
            startNumber: number;
            padding: number;
            autoIncrement: boolean;
        }>;
    };
};

const STORAGE_KEY = "saas-onboarding-draft";

const DEFAULT_DRAFT: OnboardingDraft = {
    organization: {
        legalName: "",
        displayName: "",
        slug: "",
        code: "",
        primaryCountry: "CO",
        defaultCurrency: "COP",
        defaultTimeZone: "America/Bogota",
        defaultLocale: "es-CO",
    },
    branding: {
        brandName: "",
        logoDarkUrl: "",
        logoLightUrl: "",
        logoIconUrl: "",
        primaryColor: "#D946EF",
        secondaryColor: "#0F172A",
        useDefaultBranding: true,
    },
    regional: {
        baseCountry: "CO",
        systemLanguage: "es-CO",
        operatingTimeZone: "America/Bogota",
        defaultCurrency: "COP",
        dateFormat: "DD/MM/YYYY",
        weekStartsOn: "MONDAY",
    },
    structure: {
        orgUnitName: "Sede principal",
        orgUnitType: "HEADQUARTERS",
        locationName: "Ubicación principal",
        addressLine1: "",
        city: "",
        postalCode: "",
        countryCode: "CO",
        timeZone: "America/Bogota",
    },
    businessPartner: {
        personType: "ORGANIZATION",
        legalName: "",
        tradeName: "",
        firstName: "",
        lastName: "",
        identifierType: "NIT",
        identifierValue: "",
        mainContactName: "",
        email: "",
        phone: "",
        locationRelationType: "REGISTERED_OFFICE",
        roleKey: "TENANT_OWNER",
    },
    adminUser: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        preferredLanguage: "es-CO",
        setupPasswordNow: true,
        password: "",
        membershipRoleKey: "ADMIN",
    },
    roles: {
        preset: "ENTERPRISE_CORE",
        adminAssignedRoleKey: "ADMIN",
        roles: [
            {
                key: "ADMIN",
                name: "Administrator",
                description: "Acceso total al tenant.",
                isSystem: true,
                permissions: [
                    "tenant.read",
                    "tenant.write",
                    "users.read",
                    "users.write",
                    "roles.read",
                    "roles.write",
                    "projects.read",
                    "projects.write",
                    "budgets.read",
                    "budgets.write",
                    "billing.read",
                    "billing.write",
                ],
            },
            {
                key: "MANAGER",
                name: "Manager",
                description: "Gestión operativa sin control total del tenant.",
                isSystem: false,
                permissions: [
                    "users.read",
                    "projects.read",
                    "projects.write",
                    "budgets.read",
                    "budgets.write",
                ],
            },
            {
                key: "VIEWER",
                name: "Viewer",
                description: "Acceso de solo lectura.",
                isSystem: false,
                permissions: ["users.read", "projects.read", "budgets.read"],
            },
        ],
    },
    numberRanges: {
        ranges: [
            {
                entity: "payment",
                prefix: "PY",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "invoice",
                prefix: "IV",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "quote",
                prefix: "QT",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "task",
                prefix: "TK",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "change_order",
                prefix: "CO",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "remodeling_project",
                prefix: "PR",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "location",
                prefix: "LO",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "org_unit",
                prefix: "OU",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
            {
                entity: "business_partner",
                prefix: "BP",
                startNumber: 1,
                padding: 6,
                autoIncrement: true,
            },
        ],
    },

};

export function useOnboardingDraft() {
    const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;

                setDraft({
                    ...DEFAULT_DRAFT,
                    ...parsed,
                    organization: {
                        ...DEFAULT_DRAFT.organization,
                        ...parsed.organization,
                    },
                    branding: {
                        ...DEFAULT_DRAFT.branding,
                        ...parsed.branding,
                    },
                    regional: {
                        ...DEFAULT_DRAFT.regional,
                        ...parsed.regional,
                    },
                    structure: {
                        ...DEFAULT_DRAFT.structure,
                        ...parsed.structure,
                    },
                    businessPartner: {
                        ...DEFAULT_DRAFT.businessPartner,
                        ...parsed.businessPartner,
                    },
                    adminUser: {
                        ...DEFAULT_DRAFT.adminUser,
                        ...parsed.adminUser,
                    },
                    roles: {
                        ...DEFAULT_DRAFT.roles,
                        ...parsed.roles,
                        roles: parsed.roles?.roles ?? DEFAULT_DRAFT.roles.roles,
                    },
                    numberRanges: {
                        ...DEFAULT_DRAFT.numberRanges,
                        ...parsed.numberRanges,
                        ranges: parsed.numberRanges?.ranges ?? DEFAULT_DRAFT.numberRanges.ranges,
                    },
                });
            }
        } catch (error) {
            console.error("Error loading onboarding draft", error);
        } finally {
            setHydrated(true);
        }
    }, []);

    const updateDraft = (updater: (prev: OnboardingDraft) => OnboardingDraft) => {
        setDraft((prev) => {
            const next = updater(prev);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const resetDraft = () => {
        setDraft(DEFAULT_DRAFT);
        window.localStorage.removeItem(STORAGE_KEY);
    };

    return {
        draft,
        hydrated,
        updateDraft,
        resetDraft,
    };
}