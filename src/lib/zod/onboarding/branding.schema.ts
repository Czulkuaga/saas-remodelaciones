import { z } from "zod";

const hexColorRegex = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const brandingSchema = z.object({
    brandName: z
        .string()
        .trim()
        .min(2, "El nombre de marca debe tener al menos 2 caracteres.")
        .max(100, "El nombre de marca no puede superar 100 caracteres."),

    logoDarkUrl: z
        .string()
        .trim()
        .max(500, "La referencia del logo dark es demasiado larga.")
        .optional()
        .or(z.literal("")),

    logoLightUrl: z
        .string()
        .trim()
        .max(500, "La referencia del logo light es demasiado larga.")
        .optional()
        .or(z.literal("")),

    logoIconUrl: z
        .string()
        .trim()
        .max(500, "La referencia del isotipo es demasiado larga.")
        .optional()
        .or(z.literal("")),

    primaryColor: z
        .string()
        .trim()
        .regex(hexColorRegex, "El color primario debe ser un HEX válido. Ej: #D946EF"),

    secondaryColor: z
        .string()
        .trim()
        .regex(hexColorRegex, "El color secundario debe ser un HEX válido. Ej: #0F172A"),

    useDefaultBranding: z.boolean(),
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;