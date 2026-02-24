// src/lib/zod/tenant.ts
import { z } from "zod";

export const tenantSchema = z.object({
  workspace: z
    .string()
    .trim()
    .min(2, { error: "Please enter your clinic name or workspace URL." })
    .max(80, { error: "Too long. Please shorten it." }),
});

export type TenantInput = z.infer<typeof tenantSchema>;