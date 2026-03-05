import { listRolesCatalogAction } from "@/action/roles/role-actions";
import { getRbacTenantOverviewAction } from "@/action/roles/overview-actions";
import { RolesCatalogClient } from "@/components/private/roles/RolesCatalogClient";

export const runtime = "nodejs";

export default async function RolesPage() {
    const [rolesRes, overviewRes] = await Promise.all([
        listRolesCatalogAction(),
        getRbacTenantOverviewAction(),
    ]);

    return (
        <div className="p-6 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Roles</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Catálogo de roles del sistema (base) y roles específicos del tenant.
                </p>
            </div>

            <RolesCatalogClient
                roles={rolesRes.ok ? rolesRes.roles : []}
                overview={overviewRes.ok ? overviewRes.overview : null}
            />
        </div>
    );
}