import { z } from "zod";

export const businessPartnerSchema = z.object({
    legalName: z
        .string()
        .trim()
        .min(2, "La razón social debe tener al menos 2 caracteres.")
        .max(160, "La razón social no puede superar 160 caracteres."),

    tradeName: z
        .string()
        .trim()
        .max(160, "El nombre comercial no puede superar 160 caracteres.")
        .optional()
        .or(z.literal("")),

    identifierType: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un tipo de identificador."),

    identifierValue: z
        .string()
        .trim()
        .min(3, "El identificador debe tener al menos 3 caracteres.")
        .max(60, "El identificador no puede superar 60 caracteres."),

    mainContactName: z
        .string()
        .trim()
        .min(2, "El nombre del contacto debe tener al menos 2 caracteres.")
        .max(120, "El nombre del contacto no puede superar 120 caracteres."),

    email: z
        .string()
        .trim()
        .email("Debes ingresar un correo electrónico válido.")
        .max(160, "El email no puede superar 160 caracteres."),

    phone: z
        .string()
        .trim()
        .min(7, "El teléfono debe tener al menos 7 caracteres.")
        .max(30, "El teléfono no puede superar 30 caracteres."),

    locationRelationType: z.enum([
        "REGISTERED_OFFICE",
        "TRADING_FACILITY",
        "MAILING_ADDRESS",
    ]),

    roleKey: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un rol para el business partner."),
});

export type BusinessPartnerFormValues = z.infer<typeof businessPartnerSchema>;