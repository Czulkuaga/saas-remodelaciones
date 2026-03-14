export type PlanCode = "TRIAL" | "PROFESSIONAL" | "ENTERPRISE";

export type SubscriptionPreview = {
    basePriceCents: number;
    finalPriceCents: number;
    currencyCode: string;
    billingInterval: "MONTH" | "YEAR" | "LIFETIME";
    maxUsers: number | null;
    maxProjects: number | null;
    trialDays: number;
    isBeta: boolean;
    percentOff: number | null;
    amountOffCents: number | null;
    couponStatus: "idle" | "valid" | "invalid";
    couponMessage: string;
    appliedCouponCode: string;
};

export const PLAN_CONFIG: Record<
    PlanCode,
    {
        basePriceCents: number;
        currencyCode: string;
        billingInterval: "MONTH" | "YEAR" | "LIFETIME";
        maxUsers: number | null;
        maxProjects: number | null;
        trialDays: number;
    }
> = {
    TRIAL: {
        basePriceCents: 0,
        currencyCode: "USD",
        billingInterval: "MONTH",
        maxUsers: 2,
        maxProjects: 3,
        trialDays: 30,
    },
    PROFESSIONAL: {
        basePriceCents: 19900,
        currencyCode: "USD",
        billingInterval: "MONTH",
        maxUsers: 10,
        maxProjects: 25,
        trialDays: 0,
    },
    ENTERPRISE: {
        basePriceCents: 49900,
        currencyCode: "USD",
        billingInterval: "MONTH",
        maxUsers: 30,
        maxProjects: 200,
        trialDays: 0,
    }
};

export function buildSubscriptionPreview(
    planCode: PlanCode,
    options?: {
        isBeta?: boolean;
        percentOff?: number | null;
        amountOffCents?: number | null;
        couponCode?: string;
        couponStatus?: "idle" | "valid" | "invalid";
        couponMessage?: string;
    }
): SubscriptionPreview {
    const config = PLAN_CONFIG[planCode];
    const isBeta = options?.isBeta ?? false;
    const percentOff = options?.percentOff ?? null;
    const amountOffCents = options?.amountOffCents ?? null;

    let finalPriceCents = config.basePriceCents;

    if (percentOff && percentOff > 0) {
        finalPriceCents = Math.max(
            0,
            Math.round(config.basePriceCents * (1 - percentOff / 100))
        );
    }

    if (amountOffCents && amountOffCents > 0) {
        finalPriceCents = Math.max(0, finalPriceCents - amountOffCents);
    }

    return {
        ...config,
        finalPriceCents,
        isBeta,
        percentOff,
        amountOffCents,
        couponStatus: options?.couponStatus ?? "idle",
        couponMessage: options?.couponMessage ?? "",
        appliedCouponCode:
            options?.couponStatus === "valid" ? options?.couponCode ?? "" : "",
    };
}