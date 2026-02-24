import "server-only";
import { getAuthContext } from "./session";

export class AuthError extends Error {
    code: "UNAUTHENTICATED" | "FORBIDDEN";
    constructor(code: AuthError["code"], message: string) {
        super(message);
        this.code = code;
    }
}

export async function requireAuth() {
    const ctx = await getAuthContext();
    if (!ctx) throw new AuthError("UNAUTHENTICATED", "Not authenticated");
    return ctx;
}

export async function requireSuperAdmin() {
    const ctx = await requireAuth();
    if (ctx.category !== "SUPERADMIN") {
        throw new AuthError("FORBIDDEN", "SuperAdmin only");
    }
    return ctx;
}

export async function requirePermission(permissionKey: string) {
    const ctx = await requireAuth();

    // bypass total
    if (ctx.category === "SUPERADMIN") return ctx;

    if (!ctx.membershipId) throw new AuthError("FORBIDDEN", "No membership for tenant");
    if (!ctx.permissions.has(permissionKey)) {
        throw new AuthError("FORBIDDEN", `Missing permission: ${permissionKey}`);
    }
    return ctx;
}
