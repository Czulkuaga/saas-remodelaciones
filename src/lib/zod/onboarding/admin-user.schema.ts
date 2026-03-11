import { z } from "zod";

export const adminUserSchema = z
    .object({
        firstName: z
            .string()
            .trim()
            .min(2, "El nombre debe tener al menos 2 caracteres.")
            .max(80, "El nombre no puede superar 80 caracteres."),

        lastName: z
            .string()
            .trim()
            .min(2, "El apellido debe tener al menos 2 caracteres.")
            .max(80, "El apellido no puede superar 80 caracteres."),

        email: z
            .string()
            .trim()
            .email("Debes ingresar un correo electrónico válido.")
            .max(160, "El email no puede superar 160 caracteres."),

        phone: z
            .string()
            .trim()
            .min(10, "El teléfono debe tener al menos 10 caracteres.")
            .max(12, "El teléfono no puede superar 11 caracteres."),

        preferredLanguage: z
            .string()
            .trim()
            .min(2, "Debes seleccionar un idioma preferido."),

        setupPasswordNow: z.boolean(),

        password: z.string(),

        membershipRoleKey: z
            .string()
            .trim()
            .min(2, "Debes seleccionar un rol inicial."),
    })
    .superRefine((values, ctx) => {
        if (values.setupPasswordNow) {
            if (!values.password || values.password.trim().length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["password"],
                    message: "La contraseña debe tener al menos 8 caracteres.",
                });
            }
        }
    });

export type AdminUserFormValues = z.infer<typeof adminUserSchema>;