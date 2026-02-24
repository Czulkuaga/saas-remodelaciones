// src/app/(private)/layout.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components";
import { Topbar } from "@/components";
import { Footer } from "@/components";
import type { AuthFailReason } from "@/lib/auth/session";
import { getAuthStatus } from "@/lib/auth/session";
import { ResponsiveSidebar } from "@/components/ui/ResponsiveSidebar";

function toLoginReason(r: AuthFailReason) {
    // Razones que se solucionan re-autenticando
    switch (r) {
        case "missing":
        case "invalid":
            return "not_authenticated";
        case "revoked":
            return "session_revoked";
        case "expired":
            return "session_expired";
        case "idle":
            return "session_idle";
        case "host_mismatch":
            return "tenant_mismatch";
        case "user_inactive":
            return "user_inactive";
        default:
            return "not_authenticated";
    }
}

export default async function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const st = await getAuthStatus();

    if (!st.ok) {
        // Tenant apagado/suspendido/eliminado: mejor ruta dedicada
        if (st.reason === "tenant_inactive") {
            redirect("/tenant-inactive");
        }

        // Membership inactiva: acceso denegado (no es “login”)
        if (st.reason === "membership_inactive") {
            redirect("/no-access");
        }

        // El resto va a login con reason
        redirect(`/login?reason=${toLoginReason(st.reason)}`);
    }

    const session = st.session;

    const [user, tenant] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.userId },
            select: { name: true, email: true },
        }),
        prisma.tenant.findUnique({
            where: { id: session.tenantId },
            select: { name: true, slug: true, status: true, deletedAt: true },
        }),
    ]);

    // Hard guard extra por si algo cambia entre checks (race conditions)
    if (!tenant || tenant.deletedAt || tenant.status !== "ACTIVE") {
        redirect("/tenant-inactive");
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <ResponsiveSidebar
                clinic={{ name: tenant.name, slug: tenant.slug }}
                user={{ name: user?.name ?? "User", email: user?.email ?? "—" }}
            />

            <main className="flex flex-1 flex-col lg:ml-64">
                <Topbar />
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
                <Footer clinicName={tenant.name} />
            </main>
        </div>
    );
}