function Skel({ className }: { className: string }) {
    return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

function Row() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><Skel className="h-5 w-20" /></td>
            <td className="px-6 py-4"><Skel className="h-5 w-40" /></td>
            <td className="px-6 py-4"><Skel className="h-5 w-44" /></td>
            <td className="px-6 py-4"><Skel className="h-5 w-24" /></td>
            <td className="px-6 py-4"><Skel className="h-5 w-28" /></td>
        </tr>
    );
}

export function LastAccessTableSkeleton() {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <Skel className="h-6 w-44" />
                <Skel className="h-5 w-20" />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4" />
                            <th className="px-6 py-4" />
                            <th className="px-6 py-4" />
                            <th className="px-6 py-4" />
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {Array.from({ length: 6 }).map((_, i) => <Row key={i} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}