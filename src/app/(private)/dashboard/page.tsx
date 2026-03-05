import { Suspense } from "react";
import { getAuthStatusCached } from "@/lib/auth/auth-cache";
import { getDashboardOverviewAction } from "@/action/dashboard/dashboard-actions";

import { DashboardHeader, LastAccessTableSkeleton } from "@/components";
import { KpiGrid } from "@/components";
import { ClinicalAlerts } from "@/components";

import { DashboardRangeFilter } from "@/components/private/dashboard/DashboardRangeFilter";
import { DashboardWorklist } from "@/components/private/dashboard/DashboardWorklist";

import type { KpiCardItem } from "@/components/private/dashboard/KpiCard";
import { MdOutlineConstruction, MdOutlinePriorityHigh } from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { HiOutlineDocumentText } from "react-icons/hi";
import { FaBoxesStacked } from "react-icons/fa6";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { MdOutlineAssignmentLate } from "react-icons/md";
import { FaHandshake } from "react-icons/fa6";
import { ActiveProjectsProgress } from "@/components/private/dashboard/ActiveProjectsProgress";
import { FinancialTrendPreview } from "@/components/private/dashboard/FinancialTrendPreview";

function mapDashboardKpisToCards(kpis: any[]): KpiCardItem[] {
  return kpis.map((k) => {
    switch (k.key) {
      case "active_projects":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: <MdOutlineConstruction size={20} />,
          iconClass: "text-indigo-500",
          iconWrapClass: "bg-indigo-500/10",
        };

      case "overdue_tasks":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          noteClassName: "text-rose-500 font-semibold",
          icon: <MdOutlineAssignmentLate size={20} />,
          iconClass: "text-rose-500",
          iconWrapClass: "bg-rose-500/10",
        };

      case "risky_projects":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          noteClassName: "text-amber-600 font-medium",
          icon: <MdOutlinePriorityHigh size={20} />,
          iconClass: "text-amber-500",
          iconWrapClass: "bg-amber-500/10",
        };

      case "budgets_to_approve":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          noteClassName: "text-amber-600 font-medium",
          icon: <HiOutlineDocumentText size={20} />,
          iconClass: "text-amber-500",
          iconWrapClass: "bg-amber-500/10",
        };

      case "period_costs":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: <FaBoxesStacked size={20} />,
          iconClass: "text-fuchsia-500",
          iconWrapClass: "bg-fuchsia-500/10",
        };

      case "period_commitments":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: <FaHandshake size={20} />,
          iconClass: "text-sky-500",
          iconWrapClass: "bg-sky-500/10",
        };

      case "period_revenues":
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: <RiMoneyDollarCircleFill size={20} />,
          iconClass: "text-emerald-500",
          iconWrapClass: "bg-emerald-500/10",
        };

      case "period_margin": {
        const isNeg = typeof k.value === "string" && k.value.includes("-");
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: isNeg ? <FiTrendingDown size={20} /> : <FiTrendingUp size={20} />,
          iconClass: isNeg ? "text-rose-500" : "text-emerald-500",
          iconWrapClass: isNeg ? "bg-rose-500/10" : "bg-emerald-500/10",
        };
      }

      case "period_roi": {
        const isNeg = typeof k.value === "string" && k.value.includes("-");
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: isNeg ? <FiTrendingDown size={20} /> : <FiTrendingUp size={20} />,
          iconClass: isNeg ? "text-rose-500" : "text-emerald-500",
          iconWrapClass: isNeg ? "bg-rose-500/10" : "bg-emerald-500/10",
        };
      }

      default:
        return {
          title: k.title,
          value: k.value,
          note: k.note,
          icon: <FaBoxesStacked size={20} />,
          iconClass: "text-slate-500",
          iconWrapClass: "bg-slate-500/10",
        };
    }
  });
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }>; }) {
  const sp = await searchParams;

  const st = await getAuthStatusCached();
  if (!st.ok) return null;

  const overview = await getDashboardOverviewAction({
    range: sp.range,
  });

  if (!overview.ok) return null;

  const kpisCards = mapDashboardKpisToCards(overview.kpis);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <DashboardHeader
          title="Panel de Control General"
          subtitle="Resumen operativo y financiero del periodo seleccionado."
        />
        <DashboardRangeFilter value={overview.range} />
      </div>

      <KpiGrid items={kpisCards} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ActiveProjectsProgress rows={overview.activeProjectsProgress} />
          <DashboardWorklist
            items={overview.worklist.map((x) => ({
              ...x,
              due: "due" in x && x.due ? new Date(x.due).toISOString() : null,
              lastActivityAt: "lastActivityAt" in x && x.lastActivityAt ? new Date(x.lastActivityAt).toISOString() : null,
            })) as any}
          />

          <FinancialTrendPreview points={overview.trend} />

          {/* Si quieres mantener sesiones abajo como “Seguridad” */}
          <Suspense fallback={<LastAccessTableSkeleton />}>
            {/* Tu sección actual de sesiones */}
            {/* <LastAccessSection userId={st.session.userId} tenantId={st.session.tenantId} /> */}
          </Suspense>
        </div>

        <ClinicalAlerts count={overview.alerts.length} items={overview.alerts as any} />
      </div>
    </div>
  );
}