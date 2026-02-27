import { getBusinessPartnerKpisAction, getBusinessPartnerListAction } from "@/action/business-partner/business-partner";
import BusinessPartnerKpis from "./BusinessPartnerKpis";
import BusinessPartnerFiltersClient from "./BusinessPartnerFiltersClient";
import BusinessPartnerTable from "./BusinessPartnerTable";
import BusinessPartnerPagination from "./BusinessPartnerPagination";

type SP = Record<string, string | string[] | undefined>;

function sp1(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v;
}

export async function BusinessPartnerPage({
    searchParams,
}: {
    searchParams: Promise<SP> | SP;
}) {
    const sp = (await searchParams) ?? {};
    const q = sp1(sp.q) ?? "";
    const type = (sp1(sp.type) ?? "ALL") as any;
    const status = (sp1(sp.status) ?? "ALL") as any;

    const page = Number(sp1(sp.page) ?? "1") || 1;
    const pageSize = Number(sp1(sp.pageSize) ?? "20") || 20;

    const [kpis, list] = await Promise.all([
        getBusinessPartnerKpisAction(),
        getBusinessPartnerListAction({ q, type, status, page, pageSize }),
    ]);

    return (
        <section className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Terceros</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Catálogo de Business Partners (personas y organizaciones) para proyectos, compras y operaciones.
                        </p>
                    </div>

                    <a
                        href="/business-partner/new"
                        className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600"
                    >
                        Crear tercero
                    </a>
                </div>

                {/* KPIs */}
                <BusinessPartnerKpis kpis={kpis} />

                {/* Filters (client) */}
                <BusinessPartnerFiltersClient
                    initial={{ q, type, status, pageSize }}
                />

                {/* Table (server) */}
                <BusinessPartnerTable items={list.items} />

                {/* Pagination (server links) */}
                <BusinessPartnerPagination
                    total={list.total}
                    page={list.page}
                    pageSize={list.pageSize}
                    baseParams={{ q, type, status, pageSize: String(list.pageSize) }}
                />
            </div>
        </section>
    );
}