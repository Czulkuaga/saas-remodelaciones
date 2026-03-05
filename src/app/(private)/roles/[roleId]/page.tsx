import { getRolePermissionsIdsAction, listPermissionsCatalogAction } from "@/action/roles/role-actions";
import { RoleDetailClient } from "@/components/private/roles/RoleDetailClient";

export const runtime = "nodejs";

export default async function RoleDetailPage({ params }: { params: { roleId: string } }) {
    const [roleRes, permsRes] = await Promise.all([
        getRolePermissionsIdsAction(params.roleId),
        listPermissionsCatalogAction(),
    ]);

    if (!roleRes.ok) {
        return <div className="p-6 text-sm text-slate-600 dark:text-slate-400">{roleRes.message}</div>;
    }

    return (
        <RoleDetailClient
            role={roleRes.role}
            permissions={permsRes.ok ? permsRes.permissions : []}
            initialPermissionIds={roleRes.permissionIds}
        />
    );
}