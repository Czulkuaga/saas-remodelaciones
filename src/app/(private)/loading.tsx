function Skel({ className }: { className: string }) {
    return (
        <div
            className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
        />
    );
}

function SidebarSkeleton() {
    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col fixed h-full z-50 p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Skel className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                    <Skel className="h-4 w-32" />
                    <Skel className="h-3 w-20" />
                </div>
            </div>

            <div className="space-y-3 mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skel key={i} className="h-10 w-full rounded-lg" />
                ))}
            </div>
        </aside>
    );
}

function TopbarSkeleton() {
    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between ml-64">
            <Skel className="h-10 w-96 rounded-lg" />
            <div className="flex items-center gap-4">
                <Skel className="h-8 w-8 rounded-full" />
                <Skel className="h-8 w-8 rounded-full" />
            </div>
        </header>
    );
}

function ContentSkeleton() {
    return (
        <div className="p-8 ml-64 space-y-8">
            <div>
                <Skel className="h-8 w-80" />
                <Skel className="mt-3 h-4 w-96" />
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
                    >
                        <Skel className="h-6 w-10" />
                        <Skel className="h-4 w-24" />
                        <Skel className="h-8 w-20" />
                    </div>
                ))}
            </div>

            {/* Table + widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                    <Skel className="h-6 w-40" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skel key={i} className="h-10 w-full" />
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                    <Skel className="h-6 w-40" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skel key={i} className="h-14 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <SidebarSkeleton />
            <TopbarSkeleton />
            <ContentSkeleton />
        </div>
    );
}
