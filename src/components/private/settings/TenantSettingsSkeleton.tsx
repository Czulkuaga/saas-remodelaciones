export function TenantSettingsSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-7 w-72 rounded bg-slate-200/60 dark:bg-white/10" />
                    <div className="h-4 w-130 rounded bg-slate-200/60 dark:bg-white/10" />
                </div>
                <div className="h-10 w-44 rounded-lg bg-slate-200/60 dark:bg-white/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="h-72 rounded-xl bg-slate-200/60 dark:bg-white/10" />
                    <div className="h-56 rounded-xl bg-slate-200/60 dark:bg-white/10" />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-105 rounded-xl bg-slate-200/60 dark:bg-white/10" />
                    <div className="h-28 rounded-xl bg-slate-200/60 dark:bg-white/10" />
                </div>
            </div>
        </div>
    );
}