import { z } from "zod";

export const planSchema = z.object({
    planCode: z.enum(["TRIAL", "PROFESSIONAL", "ENTERPRISE", "UNLIMITED"]),
    couponCode: z.string().trim().max(40, "El cupón no puede superar 40 caracteres."),
    subscriptionPreview: z.object({
        basePriceCents: z.number().int().min(0),
        finalPriceCents: z.number().int().min(0),
        currencyCode: z.string().trim().min(3).max(3),
        billingInterval: z.enum(["MONTH", "YEAR", "LIFETIME"]),
        maxUsers: z.number().int().positive().nullable(),
        maxProjects: z.number().int().positive().nullable(),
        trialDays: z.number().int().min(0),
        isBeta: z.boolean(),
        percentOff: z.number().min(0).max(100).nullable(),
        amountOffCents: z.number().int().min(0).nullable(),
        couponStatus: z.enum(["idle", "valid", "invalid"]),
        couponMessage: z.string(),
        appliedCouponCode: z.string(),
    }),
});

export type PlanFormValues = z.infer<typeof planSchema>;