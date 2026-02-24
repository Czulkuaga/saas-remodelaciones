"use client";

import React from "react";
import { IoClose } from "react-icons/io5";
import { Sidebar, type SidebarClinic, type SidebarUser } from "./Sidebar";
import { useShellStore } from "@/store/ui/shell-store";

export function ResponsiveSidebar({
    clinic,
    user,
}: {
    clinic: SidebarClinic;
    user: SidebarUser;
}) {
    const open = useShellStore((s) => s.mobileSidebarOpen);
    const setOpen = useShellStore((s) => s.setMobileSidebarOpen);

    React.useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        if (open) {
            window.addEventListener("keydown", onKeyDown);
            document.body.style.overflow = "hidden"; // evita scroll
        }

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, setOpen]);

    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:block">
                <Sidebar clinic={clinic} user={user} />
            </div>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-60 lg:hidden transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                    }`}
            >
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => setOpen(false)}
                />

                {/* Panel */}
                <div
                    className={`
            absolute left-0 top-0 h-full w-[85%] max-w-95
            transform transition-transform duration-300 ease-out
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
                >
                    <div className="relative h-full">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute right-3 top-3 z-10 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                            aria-label="Cerrar"
                        >
                            <IoClose size={22} />
                        </button>

                        <Sidebar clinic={clinic} user={user} />
                    </div>
                </div>
            </div>
        </>
    );
}