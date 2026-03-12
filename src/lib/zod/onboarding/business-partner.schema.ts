import { z } from "zod";

const commonFields = {
    personType: z.enum(["ORGANIZATION", "INDIVIDUAL"]),

    identifierType: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un tipo de identificador."),

    identifierValue: z
        .string()
        .trim()
        .min(3, "El identificador debe tener al menos 3 caracteres.")
        .max(60, "El identificador no puede superar 60 caracteres."),

    email: z
        .string()
        .trim()
        .email("Debes ingresar un correo electrónico válido.")
        .max(160, "El email no puede superar 160 caracteres."),

    phone: z
        .string()
        .trim()
        .regex(/^\d{10}$/, {
            message: "El número de celular debe tener exactamente 10 dígitos.",
        }),

    locationRelationType: z.enum([
        "REGISTERED_OFFICE",
        "TRADING_FACILITY",
        "MAILING_ADDRESS",
    ]),

    roleKey: z
        .string()
        .trim()
        .min(2, "Debes seleccionar un rol para el business partner."),
};

export const businessPartnerSchema = z
    .object({
        ...commonFields,

        legalName: z.string().trim().max(160).optional().or(z.literal("")),
        tradeName: z.string().trim().max(160).optional().or(z.literal("")),

        firstName: z.string().trim().max(80).optional().or(z.literal("")),
        lastName: z.string().trim().max(80).optional().or(z.literal("")),
        mainContactName: z.string().trim().max(120).optional().or(z.literal("")),
    })
    .superRefine((values, ctx) => {
        if (values.personType === "ORGANIZATION") {
            if (!(values.legalName ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["legalName"],
                    message: "La razón social es obligatoria para una organización.",
                });
            }

            if (!(values.mainContactName ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["mainContactName"],
                    message: "El nombre del contacto principal es obligatorio.",
                });
            }
        }

        if (values.personType === "INDIVIDUAL") {
            if (!(values.firstName ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["firstName"],
                    message: "El nombre es obligatorio para persona natural.",
                });
            }

            if (!(values.lastName ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["lastName"],
                    message: "El apellido es obligatorio para persona natural.",
                });
            }
        }
    });

export type BusinessPartnerFormValues = z.infer<typeof businessPartnerSchema>;