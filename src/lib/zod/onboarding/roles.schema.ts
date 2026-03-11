import { z } from "zod";

const permissionKeySchema = z.string().trim().min(2);

const roleSchema = z.object({
    key: z
        .string()
        .trim()
        .min(2, "La clave del rol debe tener al menos 2 caracteres.")
        .max(40, "La clave del rol no puede superar 40 caracteres."),
    name: z
        .string()
        .trim()
        .min(2, "El nombre del rol debe tener al menos 2 caracteres.")
        .max(80, "El nombre del rol no puede superar 80 caracteres."),
    description: z
        .string()
        .trim()
        .max(180, "La descripción no puede superar 180 caracteres."),
    isSystem: z.boolean(),
    permissions: z
        .array(permissionKeySchema)
        .min(1, "El rol debe tener al menos un permiso."),
});

export const rolesSchema = z.object({
    preset: z.enum(["STANDARD", "ENTERPRISE_CORE", "MINIMAL"]),
    roles: z
        .array(roleSchema)
        .min(1, "Debes tener al menos un rol configurado."),
    adminAssignedRoleKey: z
        .string()
        .trim()
        .min(2, "Debes indicar el rol asignado al administrador inicial."),
});

export type RolesFormValues = z.infer<typeof rolesSchema>;
export type OnboardingRoleFormItem = z.infer<typeof roleSchema>;