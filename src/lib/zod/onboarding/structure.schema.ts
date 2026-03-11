import { z } from "zod";

export const structureSchema = z.object({
    orgUnitName: z
        .string()
        .trim()
        .min(2, "El nombre de la unidad debe tener al menos 2 caracteres.")
        .max(120, "El nombre de la unidad no puede superar 120 caracteres."),

    orgUnitType: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un tipo de unidad."),

    locationName: z
        .string()
        .trim()
        .min(2, "El nombre de la ubicación debe tener al menos 2 caracteres.")
        .max(120, "El nombre de la ubicación no puede superar 120 caracteres."),

    addressLine1: z
        .string()
        .trim()
        .min(5, "La dirección debe tener al menos 5 caracteres.")
        .max(200, "La dirección no puede superar 200 caracteres."),

    city: z
        .string()
        .trim()
        .min(2, "La ciudad debe tener al menos 2 caracteres.")
        .max(80, "La ciudad no puede superar 80 caracteres."),

    postalCode: z
        .string()
        .trim()
        .min(2, "El código postal debe tener al menos 2 caracteres.")
        .max(20, "El código postal no puede superar 20 caracteres."),

    countryCode: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un país."),

    timeZone: z
        .string()
        .trim()
        .min(2, "Debes seleccionar una zona horaria."),
});

export type StructureFormValues = z.infer<typeof structureSchema>;