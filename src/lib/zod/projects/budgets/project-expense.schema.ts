import { z } from "zod";
import { CostCategory, CostDocType } from "../../../../../generated/prisma/enums";

const decimalLike = z
    .string()
    .trim()
    .min(1, "Valor requerido.")
    .refine((v) => !Number.isNaN(Number(v)), "Debe ser un número válido.")
    .refine((v) => Number(v) >= 0, "Debe ser mayor o igual a 0.");

const optionalDecimalLike = z
    .string()
    .trim()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v))
    .refine((v) => v == null || !Number.isNaN(Number(v)), "Debe ser un número válido.")
    .refine((v) => v == null || Number(v) >= 0, "Debe ser mayor o igual a 0.");

const optionalDateLike = z
    .string()
    .trim()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v));

export const createProjectExpenseSchema = z.object({
    partnerId: z.string().trim().optional().transform((v) => (v ? v : undefined)),
    userId: z.string().trim().optional().transform((v) => (v ? v : undefined)),

    docType: z.nativeEnum(CostDocType).optional(),
    docNo: z.string().trim().max(100).optional().transform((v) => (v ? v : undefined)),
    docDate: optionalDateLike,
    occurredAt: optionalDateLike,
    notes: z.string().trim().max(5000).optional().transform((v) => (v ? v : undefined)),

    currencyCode: z.string().trim().min(1, "Moneda requerida.").max(10),
    subtotalAmount: optionalDecimalLike,
    taxAmount: optionalDecimalLike,
    totalAmount: decimalLike,
});

export const createProjectExpenseItemSchema = z.object({
    description: z.string().trim().min(1, "Descripción requerida.").max(500),
    quantity: optionalDecimalLike,
    unitPrice: optionalDecimalLike,
    lineAmount: decimalLike,
    category: z.nativeEnum(CostCategory).optional(),
    rawExtractedText: z.string().trim().optional().transform((v) => (v ? v : undefined)),
});

export const createProjectExpenseAllocationSchema = z.object({
    expenseItemId: z.string().trim().min(1, "Item requerido."),
    budgetLineId: z.string().trim().min(1, "Línea presupuestal requerida."),
    amount: decimalLike,
    notes: z.string().trim().max(1000).optional().transform((v) => (v ? v : undefined)),
});

export const saveProjectExpenseAllocationsSchema = z.object({
    expenseItemId: z.string().trim().min(1, "Item requerido."),
    allocations: z
        .array(
            z.object({
                budgetLineId: z.string().trim().min(1, "Línea presupuestal requerida."),
                amount: decimalLike,
                notes: z.string().trim().max(1000).optional().transform((v) => (v ? v : undefined)),
            })
        )
        .min(1, "Debes agregar al menos una asignación."),
});

export const postProjectExpenseSchema = z.object({
    expenseId: z.string().trim().min(1, "Gasto requerido."),
});