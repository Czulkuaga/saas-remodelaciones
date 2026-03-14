export type OnboardingStepIconKey =
    | "domain"
    | "palette"
    | "language"
    | "account_tree"
    | "apartment"
    | "person"
    | "shield"
    | "tag"
    | "task_alt"
    | "plans";

export type OnboardingStepItem = {
    id: string;
    title: string;
    href: string;
    icon: OnboardingStepIconKey;
};


export const ONBOARDING_STEPS: OnboardingStepItem[] = [
    {
        id: "organization",
        title: "Organización",
        href: "/onboarding/organization",
        icon: "domain",
    },
    {
        id: "branding",
        title: "Branding",
        href: "/onboarding/branding",
        icon: "palette",
    },
    {
        id: "regional",
        title: "Regional",
        href: "/onboarding/regional",
        icon: "language",
    },
    {
        id: "structure",
        title: "Estructura base",
        href: "/onboarding/structure",
        icon: "account_tree",
    },
    {
        id: "business-partner",
        title: "Business Partner",
        href: "/onboarding/business-partner",
        icon: "apartment",
    },
    {
        id: "admin-user",
        title: "Administrador inicial",
        href: "/onboarding/admin-user",
        icon: "person",
    },
    {
        id: "roles",
        title: "Roles y accesos",
        href: "/onboarding/roles",
        icon: "shield",
    },
    {
        id: "number-ranges",
        title: "Numeración",
        href: "/onboarding/number-ranges",
        icon: "tag",
    },
        {
        id: "plan",
        title: "Subscripciones",
        href: "/onboarding/plan",
        icon: "plans",
    },
    {
        id: "review",
        title: "Revisión",
        href: "/onboarding/review",
        icon: "task_alt",
    },
];