import { listRolesCatalogAction } from "@/action/roles/role-actions";
import { listMembershipsForRoleAssignAction } from "@/action/roles/membership-role-actions";
import { RoleAssignClient } from "@/components/private/roles/RoleAssignClient";

export const runtime = "nodejs";

export default async function RoleAssignPage() {
    const [rolesRes, memRes] = await Promise.all([listRolesCatalogAction(), listMembershipsForRoleAssignAction()]);

    return (
        <RoleAssignClient
            roles={rolesRes.ok ? rolesRes.roles : []}
            memberships={memRes.ok ? memRes.memberships : []}
        />
    );
}