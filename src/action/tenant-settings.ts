"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import type { TenantSettingsDTO } from "@/types/settings/types"; // ajusta

export async function getTenantSettingsAction(): Promise<TenantSettingsDTO> {
    const tenantId = await requireTenantId();

    const [tenant, locales, timeZones, currencies, countries] = await Promise.all([
        prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                code: true,
                name: true,
                slug: true,
                status: true,
                deletedAt: true,

                countryCode: true,
                defaultLocaleCode: true,
                defaultTimeZoneId: true,
                defaultCurrencyCode: true,

                createdAt: true,
                updatedAt: true,

                _count: {
                    select: {
                        orgUnits: true,
                        locations: true,
                        memberships: true,
                        remodelingProjects: true,
                    },
                },

                tenantBranding: {
                    select: { logoUrl: true, logoName: true },
                },

                orgBusinessPartnerId: true,
                orgBusinessPartner: {
                    select: {
                        id: true,
                        code: true,
                        type: true,
                        organizationName: true,
                        email: true,
                        phone: true,
                        isActive: true,

                        identifiers: {
                            orderBy: [{ isPrimary: "desc" }, { type: "asc" }],
                            select: {
                                id: true,
                                type: true,
                                value: true,
                                countryCode: true,
                                isPrimary: true,
                                isVerified: true,
                            },
                        },

                        businessPartnerLocations: {
                            where: { usage: "BILLING", isPrimary: true },
                            take: 1,
                            select: {
                                location: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true,
                                        addressLine1: true,
                                        addressLine2: true,
                                        district: true,
                                        state: true,
                                        city: true,
                                        postalCode: true,
                                        countryCode: true,
                                        latitude: true,
                                        longitude: true,
                                        contactName: true,
                                        contactPhone: true,
                                        contactEmail: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),

        prisma.locale.findMany({
            where: { isActive: true },
            orderBy: [{ name: "asc" }],
            select: { code: true, name: true, isActive: true },
        }),

        prisma.timeZone.findMany({
            where: { isActive: true },
            orderBy: [{ label: "asc" }],
            select: { id: true, label: true, isActive: true },
        }),

        prisma.currency.findMany({
            where: { isActive: true },
            orderBy: [{ code: "asc" }],
            select: { code: true, name: true, symbol: true, isActive: true },
        }),

        prisma.country.findMany({
            where: { isActive: true },
            orderBy: [{ name: "asc" }],
            select: { code: true, name: true, isActive: true },
        }),
    ]);

    if (!tenant) throw new Error("Tenant not found");

    const org = tenant.orgBusinessPartner && tenant.orgBusinessPartner.type === "ORGANIZATION"
        ? tenant.orgBusinessPartner
        : null;

    const billingLoc = tenant.orgBusinessPartner?.businessPartnerLocations?.[0]?.location ?? null;

    return {
        // tenant core
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        countryCode: tenant.countryCode,

        defaultLocaleCode: tenant.defaultLocaleCode,
        defaultTimeZoneId: tenant.defaultTimeZoneId,
        defaultCurrencyCode: tenant.defaultCurrencyCode,

        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,

        counts: {
            orgUnits: tenant._count.orgUnits,
            locations: tenant._count.locations,
            memberships: tenant._count.memberships,
            remodelingProjects: tenant._count.remodelingProjects,
        },

        // catalogs
        locales,
        timeZones,
        currencies,
        countries,

        // branding
        branding: tenant.tenantBranding
            ? {
                logoUrl: tenant.tenantBranding.logoUrl ?? null,
                logoName: tenant.tenantBranding.logoName ?? null,
            }
            : null,

        // org BP
        orgBP: org
            ? {
                id: org.id,
                code: org.code,
                organizationName: org.organizationName,
                email: org.email,
                phone: org.phone,
                isActive: org.isActive,
            }
            : null,

        orgIdentifiers: org?.identifiers ?? [],

        orgBillingLocation: billingLoc
            ? {
                ...billingLoc,
                latitude: billingLoc.latitude ? String(billingLoc.latitude) : null,
                longitude: billingLoc.longitude ? String(billingLoc.longitude) : null,
            }
            : null,
    };
}