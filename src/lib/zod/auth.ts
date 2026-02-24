// src/lib/zod/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: "Email is required" })
    .pipe(z.email({ error: "Invalid email address" })),

  password: z
    .string()
    .min(1, { error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" })
    .max(64, { error: "Password must be at most 64 characters" }),

  remember: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
