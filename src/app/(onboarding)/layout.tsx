import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "SAAS Proyectos | Onboarding",
    description: "Plataforma de gestión de proyectos",
};

export default function OnboardingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="min-h-screen w-full bg-slate-950 text-slate-100">
            {children}
        </main>
    );
}