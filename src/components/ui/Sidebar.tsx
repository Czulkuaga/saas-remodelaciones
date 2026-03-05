import React from "react";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { ActiveNavLink } from "./ActiveNavLink";
import { SidebarGroup } from "./SidebarGroup";

// Icons
import { MdOutlineDashboard } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
// import { RiAdminLine } from "react-icons/ri";
import { GrHost } from "react-icons/gr";
import { IoMdSettings } from "react-icons/io";
import { FiSettings } from "react-icons/fi";

import { FaUsers } from "react-icons/fa";
// import { RiTeamLine } from "react-icons/ri";
import { MdOutlineSecurity } from "react-icons/md";
import { FiLink } from "react-icons/fi";
// import { FaFileInvoiceDollar } from "react-icons/fa";
import { RiHistoryLine } from "react-icons/ri";
import { FaBuildingCircleArrowRight } from "react-icons/fa6";
import { LiaUsersCogSolid } from "react-icons/lia";

export type SidebarClinic = { name: string; slug?: string | null };
export type SidebarUser = { name: string; email: string };

type NavItem = { key: string; href: string; icon: React.ReactNode; label: string };

const MAIN: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: <MdOutlineDashboard size={20} />,
    label: "Inicio",
  },
  {
    key: "calendar",
    href: "/calendar",
    icon: <FaCalendarAlt size={20} />,
    label: "Agenda",
  },
];

const SESSIONS: NavItem[] = [
  // {
  //   key: "my_sessions",
  //   href: "/account/sessions",
  //   icon: <FaUser size={20} />,
  //   label: "Mis sesiones",
  // },
  // {
  //   key: "org_sessions",
  //   href: "/admin/sessions",
  //   icon: <RiAdminLine size={20} />,
  //   label: "Sesiones de la organización",
  // },
];

// Mismo contenido; solo renombro el grupo "Historia Clínica" a algo más neutral
const ORG_SECTIONS = [
  {
    title: "Gestión",
    items: [
      {
        key: "users",
        href: "/users",
        label: "Usuarios",
        icon: <FaUsers size={18} />,
      },
      // {
      //   key: "teams",
      //   href: "/admin/teams",
      //   label: "Equipos",
      //   icon: <RiTeamLine size={18} />,
      // },
      {
        key: "roles",
        href: "/admin/roles",
        label: "Roles y permisos",
        icon: <MdOutlineSecurity size={18} />,
      },
      {
        key: "projects",
        href: "/projects",
        label: "Proyectos de remodelación",
        icon: <FaBuildingCircleArrowRight size={18} />,
      },
      {
        key: "bp",
        href: "/business-partner",
        label: "Terceros",
        icon: <LiaUsersCogSolid size={18}/>,
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      // {
      //   key: "organization",
      //   href: "/admin/organization",
      //   label: "Datos de la organización",
      //   icon: <FiSettings size={18} />,
      // },
      {
        key: "integrations",
        href: "/admin/integrations",
        label: "Integraciones",
        icon: <FiLink size={18} />,
      },
      // {
      //   key: "billing",
      //   href: "/admin/billing",
      //   label: "Facturación",
      //   icon: <FaFileInvoiceDollar size={18} />,
      // },
    ],
  },
  {
    title: "Auditoría",
    items: [
      {
        key: "activity",
        href: "/admin/activity",
        label: "Actividad",
        icon: <RiHistoryLine size={18} />,
      },
    ],
  },
];

export function Sidebar({ clinic, user }: { clinic: SidebarClinic; user: SidebarUser }) {
  return (
    <aside className="fixed z-50 flex h-full w-76 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 md:w-64">
      {/* Organization */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
            <GrHost size={18} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-black text-slate-900 dark:text-white">
              {clinic.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {clinic.slug ?? "—"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-300">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500/90" />
                Activa
              </span>
            </div>
          </div>
        </div>

        {/* <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
          Panel de trabajo • Acceso seguro
        </div> */}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Navegación
        </p>

        {MAIN.map((it) => (
          <ActiveNavLink
            key={it.key}
            href={it.href}
            icon={it.icon}
            label={it.label}
            exact={it.href === "/dashboard"}
          />
        ))}

        {/* Group */}
        <SidebarGroup
          groupKey="organization"
          href="/admin"
          label="Organización"
          icon={<FiSettings size={20} />}
          sections={ORG_SECTIONS}
        />

        <div className="pt-3">
          {/* <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Seguridad
          </p> */}

          {SESSIONS.map((it) => (
            <ActiveNavLink key={it.key} href={it.href} icon={it.icon} label={it.label} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="space-y-2 border-t border-slate-200/70 p-4 dark:border-slate-800">
        <ActiveNavLink href="/settings" icon={<IoMdSettings size={20} />} label="Configuración" />
        {/* <ActiveNavLink
          href="/account"
          icon={<IoMdSettings size={20} />}
          label="Mi cuenta"
        /> */}

        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/30">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}