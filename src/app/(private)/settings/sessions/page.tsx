import { prisma } from "@/lib/prisma";
import { getAuthStatusCached } from "@/lib/auth/auth-cache";

export default async function TenantSessionsPage() {
    const st = await getAuthStatusCached();
    if (!st.ok) return null;

    const sessions = await prisma.session.findMany({
        where: { tenantId: st.session.tenantId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
            id: true,
            createdAt: true,
            lastSeenAt: true,
            expiresAt: true,
            revokedAt: true,
            ip: true,
            userAgent: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Tenant Sessions</h1>
                <p className="text-sm text-slate-400">
                    SuperAdmin view: sessions across this tenant.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800">
                    <div className="col-span-2">User</div>
                    <div className="col-span-3">Created</div>
                    <div className="col-span-3">Last seen</div>
                    <div className="col-span-2">Expires</div>
                    <div className="col-span-2">Status</div>
                </div>

                {sessions.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-400">No sessions found.</div>
                ) : (
                    <ul className="divide-y divide-slate-800">
                        {sessions.map((s) => (
                            <li key={s.id} className="px-4 py-4">
                                <div className="grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-2 text-xs text-slate-300 break-all">
                                        <div className="text-sm text-slate-200">
                                            {s.user?.name ?? "—"} <span className="text-slate-400">({s.user?.email})</span>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-slate-200">
                                        {new Date(s.createdAt).toLocaleString()}
                                    </div>
                                    <div className="col-span-3 text-sm text-slate-200">
                                        {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "—"}
                                    </div>
                                    <div className="col-span-2 text-sm text-slate-200">
                                        {new Date(s.expiresAt).toLocaleString()}
                                    </div>

                                    <div className="col-span-2">
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                                s.revokedAt ? "bg-slate-800 text-slate-300" : "bg-emerald-900/40 text-emerald-200",
                                            ].join(" ")}
                                        >
                                            {s.revokedAt ? "Revoked" : "Active"}
                                        </span>

                                        <div className="mt-2 text-xs text-slate-400">
                                            <div>IP: {s.ip ?? "—"}</div>
                                            <div className="line-clamp-2">UA: {s.userAgent ?? "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}