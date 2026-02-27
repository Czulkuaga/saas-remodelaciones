type Props = {
    total: number;
    page: number;
    pageSize: number;
    baseParams: Record<string, string>;
};

export default function BusinessPartnerPagination({ total, page, pageSize, baseParams }: Props) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    function link(toPage: number) {
        const p = new URLSearchParams(baseParams);
        p.set("page", String(toPage));
        return `/business-partner?${p.toString()}`;
    }

    const prev = Math.max(1, page - 1);
    const next = Math.min(totalPages, page + 1);

    return (
        <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
                Página <span className="font-bold text-slate-200">{page}</span> de{" "}
                <span className="font-bold text-slate-200">{totalPages}</span> — Total: {total}
            </p>

            <div className="flex items-center gap-2">
                <a
                    href={link(prev)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 border border-fuchsia-500/20 bg-slate-900/40 hover:bg-white/5"
                >
                    Anterior
                </a>
                <a
                    href={link(next)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 border border-fuchsia-500/20 bg-slate-900/40 hover:bg-white/5"
                >
                    Siguiente
                </a>
            </div>
        </div>
    );
}