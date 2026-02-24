"use client";

import { useState } from "react";
import { MdLogout } from "react-icons/md";
import { useSidebarStore } from "@/store/ui/sidebar-store";

export function LogoutButton() {
    const [loading, setLoading] = useState(false);
    const resetSidebar = useSidebarStore((s) => s.reset);

    async function handleLogout() {
        try {
            setLoading(true);
            resetSidebar(); // Limpia el estado del sidebar al cerrar sesión

            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            const data = await res.json();

            if (data.ok) {
                window.location.href = data.redirectTo ?? "/login";
            }
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-slate-700 hover:bg-rose-400 text-white px-4 py-2 rounded-lg transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
            {
                loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span
                            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"
                            aria-hidden="true"
                        />
                    </span>
                ) : <MdLogout size={20} />
            }
        </button>
    );
}
