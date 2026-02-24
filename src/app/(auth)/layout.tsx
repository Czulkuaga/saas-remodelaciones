import type { Metadata } from "next";
import React from "react";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "SAAS Proyectos | Autenticação",
    description: "Plataforma de gestão projectos",
};

function isTenantHost(host: string) {
    const clean = host.split(":")[0].toLowerCase();
    const parts = clean.split(".").filter(Boolean);

    // local: demo.localhost
    if (parts.length === 2 && parts[1] === "localhost") return true;

    // prod: slug.miapp.com
    if (parts.length >= 3) {
        const sub = parts[0];
        return !!sub && !["www", "app"].includes(sub);
    }

    return false;
}

export default async function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const h = await headers()
    const host = h.get("host") ?? "";
    const ctx = await getAuthContext();

    // Solo redirigimos si ya está logueado Y está en un host de tenant (subdominio)
    if (ctx && isTenantHost(host)) {
        redirect("/dashboard");
    }

    return <main className="w-screen h-screen">{children}</main>;
}