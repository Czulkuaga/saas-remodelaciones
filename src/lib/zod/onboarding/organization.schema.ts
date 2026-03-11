import { z } from "zod";

export const organizationSchema = z.object({
    legalName: z
        .string()
        .trim()
        .min(3, "El nombre legal debe tener al menos 3 caracteres.")
        .max(120, "El nombre legal no puede superar 120 caracteres."),

    displayName: z
        .string()
        .trim()
        .min(3, "El nombre comercial debe tener al menos 3 caracteres.")
        .max(120, "El nombre comercial no puede superar 120 caracteres."),

    slug: z
        .string()
        .trim()
        .min(3, "El slug debe tener al menos 3 caracteres.")
        .max(50, "El slug no puede superar 50 caracteres.")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "El slug solo puede contener minúsculas, números y guiones."
        ),

    code: z
        .string()
        .trim()
        .min(3, "El código interno debe tener al menos 2 caracteres.")
        .max(30, "El código interno no puede superar 30 caracteres.")
        .regex(
            /^[A-Z0-9-_]+$/,
            "El código interno solo puede contener mayúsculas, números, guiones y guion bajo."
        ),

    primaryCountry: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un país principal."),

    defaultCurrency: z
        .string()
        .trim()
        .min(1, "Debes seleccionar una moneda por defecto."),

    defaultTimeZone: z
        .string()
        .trim()
        .min(1, "Debes seleccionar una zona horaria."),

    defaultLocale: z
        .string()
        .trim()
        .min(1, "Debes seleccionar un locale por defecto."),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;