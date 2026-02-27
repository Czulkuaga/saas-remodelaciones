import type { TenantSettingsDTO } from "../../../types/settings/types";
import TenantSettingsHeaderClient from "./TenantSettingsHeaderClient";
import TenantBrandingCardClient from "./TenantBrandingCardClient";
import TenantStatusCard from "./TenantStatusCard";
import TenantOrganizationFormClient from "./TenantOrganizationFormClient";
import TenantSecurityCardClient from "./TenantSecurityCardClient";
import TenantOrgCompanyFormClient from "./TenantOrgCompanyFormClient";
import TenantOrgIdentifiersCardClient from "./TenantOrgIdentifiersCardClient";
import TenantOrgBillingAddressFormClient from "./TenantOrgBillingAddressFormClient";

export function TenantSettingsShell({ initial }: { initial: TenantSettingsDTO }) {
  return (
    <>
      <TenantSettingsHeaderClient />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <TenantBrandingCardClient initial={initial} />
          <TenantStatusCard initial={initial} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <TenantOrganizationFormClient initial={initial} />

          {/* ✅ Identificadores */}
          <TenantOrgIdentifiersCardClient initial={initial} />

          {/* ✅ Dirección fiscal (BILLING primary) */}
          <TenantOrgBillingAddressFormClient initial={initial} />

          {/* ✅ Empresa (BP principal) */}
          <TenantOrgCompanyFormClient initial={initial} />

          <TenantSecurityCardClient />
        </div>
      </div>
    </>
  );
}