import { z } from "zod";

export const numberRangeItemSchema = z.object({
    entity: z
        .string()
        .trim()
        .min(2, "La entidad es obligatoria."),

    prefix: z
        .string()
        .trim()
        .min(1, "El prefijo es obligatorio.")
        .max(6, "El prefijo no puede superar 6 caracteres."),

    startNumber: z.coerce
        .number()
        .int("El número inicial debe ser entero.")
        .min(0, "El número inicial no puede ser negativo."),

    padding: z.coerce
        .number()
        .int("El padding debe ser entero.")
        .min(1, "El padding mínimo es 1.")
        .max(12, "El padding máximo es 12."),

    autoIncrement: z.boolean(),
});

export const numberRangesSchema = z.object({
    ranges: z
        .array(numberRangeItemSchema)
        .min(1, "Debe existir al menos un rango configurado."),
});

export type NumberRangeFormItem = z.infer<typeof numberRangeItemSchema>;
export type NumberRangesFormValues = z.infer<typeof numberRangesSchema>;