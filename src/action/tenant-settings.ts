"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import type { TenantSettingsDTO } from "@/types/settings/types";

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
                    select: {
                        brandName: true,
                        logoName: true,
                        logoDarkUrl: true,
                        logoLightUrl: true,
                        logoIconUrl: true,
                    },
                },

                orgBusinessPartnerId: true,
                orgBusinessPartner: {
                    select: {
                        id: true,
                        code: true,
                        type: true,
                        organizationName: true,
                        firstName: true,
                        lastName: true,
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
            distinct: ["code"],
            orderBy: [{ name: "asc" }],
            select: { code: true, name: true, isActive: true },
        }),

        prisma.timeZone.findMany({
            where: { isActive: true },
            distinct: ["id"],
            orderBy: [{ label: "asc" }],
            select: { id: true, label: true, isActive: true },
        }),

        prisma.currency.findMany({
            where: { isActive: true },
            distinct: ["code"],
            orderBy: [{ code: "asc" }],
            select: { code: true, name: true, symbol: true, isActive: true },
        }),

        prisma.country.findMany({
            where: { isActive: true },
            distinct: ["code"],
            orderBy: [{ name: "asc" }],
            select: { code: true, name: true, isActive: true },
        }),
    ]);

    if (!tenant) {
        throw new Error("Tenant not found");
    }

    const primaryBP = tenant.orgBusinessPartner ?? null;

    const billingLoc = primaryBP?.businessPartnerLocations?.[0]?.location ?? null;

    return {
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

        locales,
        timeZones,
        currencies,
        countries,

        branding: {
            // brandName: tenant.tenantBranding?.brandName ?? tenant.name,
            logoUrl: tenant.tenantBranding?.logoLightUrl ?? null,
            logoName: tenant.tenantBranding?.logoName ?? null,
            logoDarkUrl: tenant.tenantBranding?.logoDarkUrl ?? null,
            logoLightUrl: tenant.tenantBranding?.logoLightUrl ?? null,
            logoIconUrl: tenant.tenantBranding?.logoIconUrl ?? null,
        },

        orgBP: primaryBP
            ? {
                id: primaryBP.id,
                code: primaryBP.code,
                type: primaryBP.type,
                organizationName:
                    primaryBP.organizationName ??
                    ([primaryBP.firstName, primaryBP.lastName].filter(Boolean).join(" ") || null),
                email: primaryBP.email,
                phone: primaryBP.phone,
                isActive: primaryBP.isActive,
            }
            : null,

        orgIdentifiers: primaryBP?.identifiers ?? [],

        orgBillingLocation: billingLoc
            ? {
                ...billingLoc,
                latitude: billingLoc.latitude ? String(billingLoc.latitude) : null,
                longitude: billingLoc.longitude ? String(billingLoc.longitude) : null,
            }
            : null,
    };
}