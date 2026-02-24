
export type SessionRow = {
  id: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
};

function fmt(dt: Date) {
  // SSR-safe. Luego lo podemos localizar al tenant TZ.
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

function deviceIconFromUA(ua?: string | null) {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "device_unknown";
  if (s.includes("ipad") || s.includes("tablet")) return "tablet_mac";
  if (s.includes("iphone") || s.includes("android") || s.includes("mobile")) return "smartphone";
  if (s.includes("mac") || s.includes("windows") || s.includes("linux")) return "desktop_windows";
  return "laptop";
}

function browserLabel(ua?: string | null) {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "—";
  if (s.includes("edg/")) return "Edge";
  if (s.includes("chrome/")) return "Chrome";
  if (s.includes("safari/") && !s.includes("chrome/")) return "Safari";
  if (s.includes("firefox/")) return "Firefox";
  return "Browser";
}

function statusPill(s: SessionRow) {
  if (s.revokedAt) {
    return { label: "Revocada", cls: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" };
  }
  const now = Date.now();
  if (s.expiresAt.getTime() <= now) {
    return { label: "Expirada", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" };
  }
  return { label: "Activa", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
}

function ipShort(ip?: string | null) {
  if (!ip) return "—";
  // Si viene IPv6 o proxy chain, lo mostramos corto.
  return ip.length > 24 ? `${ip.slice(0, 22)}…` : ip;
}

export function LastAccessTable({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">Últimas Sesiones</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {sessions.length ? `Mostrando ${sessions.length} recientes` : "Sin sesiones registradas"}
          </p>
        </div>
        <button className="text-primary text-sm font-medium hover:underline" type="button">
          Ver todo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Inicio</th>
              <th className="px-6 py-4">Última actividad</th>
              <th className="px-6 py-4">IP</th>
              <th className="px-6 py-4">Dispositivo</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sessions.map((s) => {
              const pill = statusPill(s);
              const icon = deviceIconFromUA(s.userAgent);
              const browser = browserLabel(s.userAgent);

              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-tighter ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">
                    {fmt(s.createdAt)}
                    <div className="text-[10px] text-slate-400 mt-1">ID: {s.id.slice(0, 8)}…</div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {s.lastSeenAt ? fmt(s.lastSeenAt) : "—"}
                    <div className="text-[10px] text-slate-400 mt-1">
                      Expira: {fmt(s.expiresAt)}
                      {s.revokedAt ? ` · Revocada: ${fmt(s.revokedAt)}` : ""}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">{ipShort(s.ip)}</td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined text-slate-400">{icon}</span>
                      <span className="text-sm">{browser}</span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!sessions.length ? (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  No hay sesiones para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}