import { TenantSettingsShell, TenantSettingsSkeleton } from "@/components";
import { Suspense } from "react";
import { getTenantSettingsAction } from "@/action/tenant-settings";

export default async function SettingsPage() {
  const initial = await getTenantSettingsAction();

  // console.log(initial)

  return (
    <section className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark/50">

        <Suspense fallback={<TenantSettingsSkeleton />}>
          {/* Este es Server Component (SSR) que compone los client components */}
          <TenantSettingsShell initial={initial} />
        </Suspense>

    </section>
  );
}