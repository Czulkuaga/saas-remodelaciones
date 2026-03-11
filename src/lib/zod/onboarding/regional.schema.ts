import { z } from "zod";

export const regionalSchema = z.object({
    baseCountry: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un país base."),

    systemLanguage: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un idioma del sistema."),

    operatingTimeZone: z
        .string()
        .trim()
        .min(3, "Debes seleccionar una zona horaria."),

    defaultCurrency: z
        .string()
        .trim()
        .min(2, "Debes seleccionar una moneda por defecto."),

    dateFormat: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un formato de fecha."),

    weekStartsOn: z.enum(["SUNDAY", "MONDAY"]),
});

export type RegionalFormValues = z.infer<typeof regionalSchema>;