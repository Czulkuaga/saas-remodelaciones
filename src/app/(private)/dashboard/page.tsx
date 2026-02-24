import { Suspense } from "react";
import { getAuthStatusCached } from "@/lib/auth/auth-cache";

// Types
import type { AlertItem } from "@/components/private/dashboard/ClinicalAlerts";

//Components
import { DashboardHeader, LastAccessSection, LastAccessTableSkeleton } from "@/components";
import { KpiGrid } from "@/components/";
import { ClinicalAlerts } from "@/components";

//Icons
import { RiMoneyDollarCircleFill,RiUserAddLine } from "react-icons/ri";

import { MdOutlineConstruction, MdOutlineSecurity } from "react-icons/md";
import { MdOutlinePriorityHigh } from "react-icons/md";
import { FiLink } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { FaBoxesStacked } from "react-icons/fa6";

export default async function DashboardPage() {
  const st = await getAuthStatusCached();
  if (!st.ok) return null;

  const { userId, tenantId } = st.session;

  const kpis = [
    {
      title: "Obras Activas",
      value: "12",
      note: "3 en fase de cierre",
      icon: <MdOutlineConstruction size={20} />,
      iconClass: "text-indigo-500",
      iconWrapClass: "bg-indigo-500/10",
      badge: {
        text: "+1 esta semana",
        icon: "trending_up",
        className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
      },
    },
    {
      title: "Presupuesto vs Ejecutado",
      value: "68%",
      note: "Ejecutado: $34,900 / $51,200",
      icon: <RiMoneyDollarCircleFill size={20} />,
      iconClass: "text-emerald-500",
      iconWrapClass: "bg-emerald-500/10",
      progress: { value: 68, barClass: "bg-emerald-500" },
    },
    {
      title: "Cotizaciones Pendientes",
      value: "7",
      note: "2 por aprobar hoy",
      noteClassName: "text-amber-600 font-medium",
      icon: <HiOutlineDocumentText size={20} />,
      iconClass: "text-amber-500",
      iconWrapClass: "bg-amber-500/10",
      badge: {
        text: "urgente",
        icon: "priority_high",
        className: "text-amber-700 bg-amber-50 dark:bg-amber-500/10",
      },
    },
    {
      title: "Órdenes de Compra",
      value: "19",
      note: "5 entregas en camino",
      icon: <FaBoxesStacked size={20} />,
      iconClass: "text-fuchsia-500",
      iconWrapClass: "bg-fuchsia-500/10",
      badge: {
        text: "+4 nuevas",
        icon: "trending_up",
        className: "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-500/10",
      },
    },
  ];

  const alerts: AlertItem[] = [
    {
      tone: "primary",
      icon: <RiUserAddLine size={20} />,
      title: "Nuevo usuario invitado",
      desc: "Se envió una invitación a ana@empresa.com para unirse a la organización.",
      time: "Hace 5 min",
    },
    {
      tone: "blue",
      icon: <FiLink size={20} />,
      title: "Integración conectada",
      desc: "La integración con Webhooks se activó correctamente (2 eventos recientes).",
      time: "Hace 45 min",
    },
    {
      tone: "amber",
      icon: <MdOutlineSecurity size={20} />,
      title: "Acceso desde nuevo dispositivo",
      desc: "Detectamos un inicio de sesión nuevo para el usuario jorge@empresa.com.",
      time: "Hace 2 horas",
    },
    {
      tone: "red",
      icon: <MdOutlinePriorityHigh size={20} />,
      title: "Permiso crítico modificado",
      desc: "Se actualizó el rol Admin: cambios en permisos de “Usuarios y Roles”.",
      time: "Hace 3 horas",
    },
  ];

  return (

    <div className="p-8">
      <DashboardHeader
        title="Panel de Control General"
        subtitle="Bienvenido de nuevo, aquí tienes el resumen del día de hoy."
      />

      <KpiGrid items={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Suspense fallback={<LastAccessTableSkeleton />}>
          <LastAccessSection userId={userId} tenantId={tenantId} />
        </Suspense>
        <ClinicalAlerts count={5} items={alerts} />
      </div>
    </div>

  );
}