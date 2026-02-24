"use client";

export default function PrivateError({ error }: { error: Error & { code?: string } }) {
    const isForbidden = (error as any)?.code === "FORBIDDEN";

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-200">
            <h2 className="text-lg font-bold">{isForbidden ? "Access denied" : "Something went wrong"}</h2>
            <p className="mt-2 text-sm text-slate-400">
                {isForbidden
                    ? "You don’t have permission to view this page."
                    : "Please try again. If the issue persists, contact support."}
            </p>
        </div>
    );
}
