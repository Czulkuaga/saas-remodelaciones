import { getTenantFromHost } from "@/lib/tenant/getTenantFromHost";

import { FormLogin } from "@/components";
import { BiSolidErrorCircle } from "react-icons/bi";
import { CiWarning } from "react-icons/ci";
import { FaCircleInfo } from "react-icons/fa6";
import { SiBaremetrics } from "react-icons/si";

type LoginSearchParams = {
  reason?: string;
};

type Banner = {
  title: string;
  message: string;
  tone: "info" | "warning" | "danger";
};

const BANNERS: Record<string, Banner> = {
  session_expired: {
    title: "Sesión expirada",
    message: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
    tone: "warning",
  },
  session_revoked: {
    title: "Sesión revocada",
    message:
      "Tu sesión se cerró porque se inició una nueva sesión en otro dispositivo. Inicia sesión nuevamente para continuar.",
    tone: "warning",
  },
  session_idle: {
    title: "Sesión cerrada por inactividad",
    message:
      "Por seguridad, tu sesión se cerró por inactividad. Inicia sesión para continuar.",
    tone: "warning",
  },
  not_authenticated: {
    title: "Acceso requerido",
    message: "Necesitas iniciar sesión para continuar.",
    tone: "info",
  },
  tenant_mismatch: {
    title: "Organización incorrecta",
    message:
      "Estás intentando acceder a una organización distinta a la de tu sesión. Verifica el subdominio e inicia sesión de nuevo.",
    tone: "danger",
  },
  user_inactive: {
    title: "Usuario inactivo",
    message:
      "Tu cuenta está deshabilitada. Contacta al administrador para reactivarla.",
    tone: "danger",
  },
};

function Alert({ reason }: { reason?: string }) {
  if (!reason) return null;

  const b = BANNERS[reason];
  if (!b) return null;

  const toneStyles: Record<Banner["tone"], string> = {
    info:
      "border-slate-200/70 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10",
    danger:
      "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 dark:border-rose-500/30 dark:bg-rose-500/10",
  };

  const iconByTone: Record<Banner["tone"], React.ReactNode> = {
    info: <FaCircleInfo size={30} />,
    warning: <CiWarning size={30} />,
    danger: <BiSolidErrorCircle size={30} />,
  };

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 ${toneStyles[b.tone]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{iconByTone[b.tone]}</div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5">{b.title}</p>
          <p className="mt-0.5 text-sm leading-5 opacity-90">{b.message}</p>
        </div>
      </div>
    </div>
  );
}

export default async function page({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const sp = await searchParams;
  const reason = sp?.reason;

  const tenant = await getTenantFromHost();

  return (
    <section className="min-h-screen font-display transition-colors duration-300">
      <div className="relative flex min-h-screen w-full overflow-hidden">
        {/* Fondo global (coherente con /tenant) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-112 w-md rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-400/10" />
          <div className="absolute top-1/2 -right-32 h-96 w-[24rem] rounded-full bg-fuchsia-500/15 blur-[110px] dark:bg-fuchsia-400/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_55%)]" />
        </div>

        {/* Columna izquierda */}
        <div className="flex w-full flex-col items-center justify-center bg-white/60 px-6 backdrop-blur-sm dark:bg-slate-950/40 md:px-16 lg:w-1/2 lg:px-24">
          <div className="w-full max-w-md">
            {/* Marca */}
            <div className="mb-2 flex flex-col justify-center gap-3">

              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-linear-to-br from-indigo-600 to-fuchsia-600 p-2 text-white shadow-lg shadow-indigo-500/20">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    ></path>
                    <path
                      clipRule="evenodd"
                      d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    ></path>
                  </svg>

                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Remodelaciones.app<span className="text-indigo-600 dark:text-indigo-400">.</span>
                </span>

              </div>

              {tenant && (
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Organización
                  </p>

                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tenant.name}
                  </p>
                </div>
              )}


            </div>

            {/* Encabezado */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/90" />
                Acceso seguro
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
                Inicia sesión
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Ingresa tus credenciales para acceder a tu panel de trabajo.
              </p>
            </div>

            {/* Banner unificado */}
            <Alert reason={reason} />

            {/* Form */}
            <FormLogin />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex">
          {/* glows */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-10%] h-120 w-120 rounded-full bg-indigo-500/20 blur-[140px]" />
            <div className="absolute bottom-[-10%] left-[-10%] h-104 w-104 rounded-full bg-fuchsia-500/15 blur-[130px]" />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-16">
            <div className="flex justify-end">
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Sistema operativo
              </span>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <SiBaremetrics size={30} className="text-indigo-300" />
              </div>

              <h2 className="mb-6 text-4xl font-black leading-tight text-white xl:text-5xl">
                Tu operación,
                <br />
                <span className="bg-linear-to-r from-indigo-300 to-fuchsia-300 bg-clip-text italic text-transparent">
                  en un solo lugar.
                </span>
              </h2>

              <p className="mb-8 text-lg leading-relaxed text-slate-300">
                Centraliza procesos, usuarios y permisos en un portal moderno y seguro.
                Accede desde cualquier dispositivo con trazabilidad y control.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-2xl font-black text-white">99.9%</p>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Disponibilidad
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-2xl font-black text-white">RBAC</p>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Control de acceso
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 rounded-full border-2 border-slate-950 bg-white/10" />
                <div className="h-10 w-10 rounded-full border-2 border-slate-950 bg-white/10" />
                <div className="h-10 w-10 rounded-full border-2 border-slate-950 bg-white/10" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-linear-to-br from-indigo-300 to-fuchsia-300 text-xs font-black text-slate-950">
                  +2k
                </div>
              </div>
              <p className="text-sm text-slate-400">Equipos que confían en la plataforma</p>
            </div>
          </div>

          {/* wave */}
          <div className="pointer-events-none absolute bottom-0 right-0 w-full opacity-20">
            <svg
              className="h-auto w-full text-indigo-300"
              viewBox="0 0 1000 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="opacity-50"
                d="M0 300 Q 250 150 500 300 T 1000 300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              ></path>
              <path
                className="opacity-30"
                d="M0 320 Q 250 170 500 320 T 1000 320"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              ></path>
              <path
                className="opacity-30"
                d="M0 280 Q 250 130 500 280 T 1000 280"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}