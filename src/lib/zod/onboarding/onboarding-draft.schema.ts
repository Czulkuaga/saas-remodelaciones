import { z } from "zod";
import { organizationSchema } from "./organization.schema";
import { brandingSchema } from "./branding.schema";
import { regionalSchema } from "./regional.schema";
import { structureSchema } from "./structure.schema";
import { businessPartnerSchema } from "./business-partner.schema";
import { adminUserSchema } from "./admin-user.schema";
import { rolesSchema } from "./roles.schema";
import { numberRangesSchema } from "./number-ranges.schema";
import { planSchema } from "./plan.schema";

export const onboardingDraftSchema = z.object({
    organization: organizationSchema,
    branding: brandingSchema,
    regional: regionalSchema,
    structure: structureSchema,
    businessPartner: businessPartnerSchema,
    adminUser: adminUserSchema,
    roles: rolesSchema,
    numberRanges: numberRangesSchema,
    plan: planSchema,
});

export type OnboardingDraftSchemaValues = z.infer<typeof onboardingDraftSchema>;