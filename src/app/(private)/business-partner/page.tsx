import { Suspense } from "react";
import { BusinessPartnerPage } from "@/components";

export const runtime = "nodejs";

type SP = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const resolved = (await searchParams) ?? {};

  return (
    <Suspense fallback={<div className="p-8 text-slate-300">Cargando terceros...</div>}>
      <BusinessPartnerPage searchParams={resolved} />
    </Suspense>
  );
}