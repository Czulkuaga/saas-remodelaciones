import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { onboardingDraftSchema } from "@/lib/zod/onboarding/onboarding-draft.schema";

import { NumberRangeObject, PartnerType, PartnerIdentifierType, LocationUsageType, MembershipCategory } from "../../../../../generated/prisma/enums";
// import { PartnerType } from "../../../../../generated/prisma/client";
import { nextNumberRangeCode } from "@/lib/number-range";
import bcrypt from "bcryptjs";
// import { codec } from "zod";

type ProvisioningResult = {
    tenantId: string;
    slug: string;
    adminEmail: string;
};

function mapDraftEntityToNumberRangeObject(entity: string): NumberRangeObject {
    switch (entity) {
        case "payment":
            return NumberRangeObject.PAYMENT;
        case "invoice":
            return NumberRangeObject.INVOICE;
        case "quote":
            return NumberRangeObject.QUOTE;
        case "task":
            return NumberRangeObject.TASK;
        case "change_order":
            return NumberRangeObject.CHANGE_ORDER;
        case "remodeling_project":
            return NumberRangeObject.REMODELING_PROJECT;
        case "location":
            return NumberRangeObject.LOCATION;
        case "org_unit":
            return NumberRangeObject.ORG_UNIT;
        case "business_partner":
            return NumberRangeObject.BUSINESS_PARTNER;
        default:
            throw new Error(`NUMBER_RANGE_OBJECT_NOT_MAPPED: ${entity}`);
    }
}

function mapDraftBusinessPartnerTypeToPrismaType(
    personType: "ORGANIZATION" | "INDIVIDUAL"
): PartnerType {
    return personType === "INDIVIDUAL"
        ? PartnerType.PERSON
        : PartnerType.ORGANIZATION;
}

function mapDraftIdentifierTypeToPrismaType(value: string) {
    switch (value) {
        case "NIT":
            return PartnerIdentifierType.CO_NIT;
        case "VAT":
            return PartnerIdentifierType.VAT_ID;
        case "EIN":
            return PartnerIdentifierType.VAT_ID;
        case "TIN":
            return PartnerIdentifierType.VAT_ID;
        case "CC":
            return PartnerIdentifierType.NATIONAL_ID;
        case "CE":
            return PartnerIdentifierType.FOREIGN_ID;
        case "PASSPORT":
            return PartnerIdentifierType.PASSPORT;
        default:
            throw new Error(`IDENTIFIER_TYPE_NOT_MAPPED: ${value}`);
    }
}

function mapDraftLocationRelationTypeToUsage(value: string) {
    switch (value) {
        case "REGISTERED_OFFICE":
            return LocationUsageType.OFFICE;
        case "TRADING_FACILITY":
            return LocationUsageType.BILLING;
        case "MAILING_ADDRESS":
            return LocationUsageType.SHIPPING;
        default:
            throw new Error(`LOCATION_USAGE_NOT_MAPPED: ${value}`);
    }
}

export const runtime = "nodejs";

function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

function normalizeSlug(value: string) {
    return value.trim().toLowerCase();
}

function normalizeIdentifier(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export async function POST(req: NextRequest) {
    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "remodelaciones.app"
    let requestKey = "";
    try {
        const body = await req.json();

        requestKey = String(body?.requestKey ?? "").trim();
        const draft = body?.draft;

        if (!requestKey) {
            return NextResponse.json(
                { ok: false, code: "MISSING_REQUEST_KEY", message: "Falta requestKey." },
                { status: 400 }
            );
        }

        const parsed = onboardingDraftSchema.safeParse(draft);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    code: "INVALID_DRAFT",
                    message: "El draft no es válido.",
                    issues: parsed.error.issues,
                },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const payloadHash = sha256(JSON.stringify(data));
        const tenantSlug = normalizeSlug(data.organization.slug);
        const createdByEmail = data.adminUser.email;

        // 1. Buscar request existente
        const existing = await prisma.provisioningRequest.findUnique({
            where: { requestKey },
        });

        if (existing) {
            if (existing.status === "SUCCESS") {
                return NextResponse.json({
                    ok: true,
                    code: "ALREADY_PROVISIONED",
                    tenantId: existing.tenantId,
                    slug: existing.tenantSlug,
                    dashboardUrl: `https://${existing.tenantSlug}.${domain}`,
                });
            }

            if (existing.status === "RUNNING") {
                return NextResponse.json({
                    ok: false,
                    code: "PROVISIONING_IN_PROGRESS",
                    message: "Este aprovisionamiento ya está en ejecución.",
                }, { status: 409 });
            }

            if (existing.payloadHash && existing.payloadHash !== payloadHash) {
                return NextResponse.json({
                    ok: false,
                    code: "REQUEST_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
                    message: "El requestKey ya fue usado con otro payload.",
                }, { status: 409 });
            }
        }

        // 2. Upsert request en RUNNING
        const provisioning = await prisma.provisioningRequest.upsert({
            where: { requestKey },
            update: {
                status: "RUNNING",
                payloadHash,
                tenantSlug,
                createdByEmail,
                errorCode: null,
                errorMessage: null,
                startedAt: new Date(),
            },
            create: {
                requestKey,
                status: "RUNNING",
                payloadHash,
                tenantSlug,
                createdByEmail,
                startedAt: new Date(),
            },
        });

        // 3. Validaciones de negocio previas
        const slugExists = await prisma.tenant.findFirst({
            where: { slug: tenantSlug },
            select: { id: true },
        });

        if (slugExists) {
            await prisma.provisioningRequest.update({
                where: { id: provisioning.id },
                data: {
                    status: "FAILED",
                    errorCode: "SLUG_ALREADY_EXISTS",
                    errorMessage: "El slug ya está en uso.",
                    finishedAt: new Date(),
                },
            });

            return NextResponse.json(
                {
                    ok: false,
                    code: "SLUG_ALREADY_EXISTS",
                    message: "El slug ya está en uso.",
                    step: "organization",
                },
                { status: 409 }
            );
        }

        // 4. Ejecutar transacción
        const result: ProvisioningResult = await prisma.$transaction(
            async (tx): Promise<ProvisioningResult> => {
                // ===== Catálogos base =====
                const country = await tx.country.findUnique({
                    where: { code: data.regional.baseCountry },
                    select: { code: true },
                });

                const currency = await tx.currency.findUnique({
                    where: { code: data.regional.defaultCurrency },
                    select: { code: true },
                });

                const locale = await tx.locale.findUnique({
                    where: { code: data.regional.systemLanguage },
                    select: { code: true },
                });

                const timeZone = await tx.timeZone.findUnique({
                    where: { id: data.regional.operatingTimeZone },
                    select: { id: true, label: true },
                });

                if (!country || !currency || !locale || !timeZone) {
                    throw new Error("CATALOG_REFERENCE_NOT_FOUND");
                }

                // ===== Tenant =====
                const tenant = await tx.tenant.create({
                    data: {
                        slug: tenantSlug,
                        code: data.organization.code,
                        name: data.organization.legalName,
                        countryCode: country.code,
                        defaultCurrencyCode: currency.code,
                        defaultLocaleCode: locale.code,
                        defaultTimeZoneId: timeZone.id,
                    },
                });

                // ===== Number ranges =====
                await tx.numberRange.createMany({
                    data: data.numberRanges.ranges.map((range) => ({
                        tenantId: tenant.id,
                        object: mapDraftEntityToNumberRangeObject(range.entity),
                        prefix: range.prefix,
                        nextNo: range.startNumber,
                        padding: range.padding,
                    })),
                });

                // ===== Branding =====
                await tx.tenantBranding.create({
                    data: {
                        tenantId: tenant.id,
                        brandName: data.branding.brandName,
                        logoDarkUrl: data.branding.logoDarkUrl || null,
                        logoLightUrl: data.branding.logoLightUrl || null,
                        logoIconUrl: data.branding.logoIconUrl || null,
                        primaryColor: data.branding.primaryColor,
                        secondaryColor: data.branding.secondaryColor,
                    },
                });

                // ===== TenantLocale / regional =====
                await tx.tenantLocale.create({
                    data: {
                        tenantId: tenant.id,
                        localeCode: data.regional.systemLanguage,
                        isActive: true,
                    },
                });

                // ===== OrgUnit =====
                const orgUnitCode = await nextNumberRangeCode({
                    tenantId: tenant.id,
                    object: NumberRangeObject.ORG_UNIT,
                    defaultPrefix: "OU",
                    defaultPadding: 4,
                    defaultNextNo: 1,
                    tx,
                });

                await tx.orgUnit.create({
                    data: {
                        tenantId: tenant.id,
                        code: orgUnitCode,
                        name: data.structure.orgUnitName,
                    },
                });

                // ===== Location =====
                const locationCode = await nextNumberRangeCode({
                    tenantId: tenant.id,
                    object: NumberRangeObject.LOCATION,
                    defaultPrefix: "LO",
                    defaultPadding: 4,
                    defaultNextNo: 1,
                    tx,
                });
                const location = await tx.location.create({
                    data: {
                        tenantId: tenant.id,
                        code: locationCode,
                        name: data.structure.locationName,
                        addressLine1: data.structure.addressLine1 || null,
                        city: data.structure.city || null,
                        postalCode: data.structure.postalCode || null,
                        countryCode: data.structure.countryCode || null,
                    },
                });

                // ===== Business Partner =====
                const businessPartnerCode = await nextNumberRangeCode({
                    tenantId: tenant.id,
                    object: NumberRangeObject.BUSINESS_PARTNER,
                    defaultPrefix: "BP",
                    defaultPadding: 4,
                    defaultNextNo: 1,
                    tx,
                });

                const bpType = mapDraftBusinessPartnerTypeToPrismaType(
                    data.businessPartner.personType
                );

                const bpDisplayName =
                    data.businessPartner.personType === "INDIVIDUAL"
                        ? `${data.businessPartner.firstName ?? ""} ${data.businessPartner.lastName ?? ""}`.trim()
                        : data.businessPartner.legalName ?? "";

                const businessPartner = await tx.businessPartner.create({
                    data: {
                        tenantId: tenant.id,
                        code: businessPartnerCode,
                        type: bpType,
                        organizationName:
                            data.businessPartner.personType === "ORGANIZATION"
                                ? data.businessPartner.legalName || bpDisplayName
                                : bpDisplayName,
                        firstName:
                            data.businessPartner.personType === "INDIVIDUAL"
                                ? data.businessPartner.firstName || null
                                : null,
                        lastName:
                            data.businessPartner.personType === "INDIVIDUAL"
                                ? data.businessPartner.lastName || null
                                : null,
                        // mainContactName: data.businessPartner.mainContactName || bpDisplayName,
                        email: data.businessPartner.email,
                        phone: data.businessPartner.phone,
                        // isMain: true,
                    },
                });

                //Asignaer BP al tenant
                await tx.tenant.update({
                    where: { id: tenant.id },
                    data: {
                        orgBusinessPartnerId: businessPartner.id,
                    },
                });

                await tx.partnerIdentifier.create({
                    data: {
                        tenantId: tenant.id,
                        partnerId: businessPartner.id,
                        type: mapDraftIdentifierTypeToPrismaType(data.businessPartner.identifierType),
                        value: data.businessPartner.identifierValue,
                        valueNorm: normalizeIdentifier(data.businessPartner.identifierValue),
                        countryCode: data.structure.countryCode || data.regional.baseCountry || null,
                        isPrimary: true,
                        isVerified: false,
                    },
                });

                await tx.businessPartnerLocation.create({
                    data: {
                        tenantId: tenant.id,
                        partnerId: businessPartner.id,
                        locationId: location.id,
                        usage: mapDraftLocationRelationTypeToUsage(data.businessPartner.locationRelationType),
                        isPrimary: true,
                    },
                });

                // ===== User =====
                const passwordHash = data.adminUser.setupPasswordNow
                    ? await bcrypt.hash(data.adminUser.password, 10)
                    : ""
                const adminUser = await tx.user.create({
                    data: {
                        firstName: data.adminUser.firstName,
                        lastName: data.adminUser.lastName,
                        email: data.adminUser.email,
                        emailNormalized: data.adminUser.email.trim().toLowerCase(),
                        phone: data.adminUser.phone,
                        phoneNormalized: data.adminUser.phone,
                        // OJO: si ya tienes helper de hash úsalo aquí
                        passwordHash: passwordHash,
                        isActive: true,
                    },
                });

                // ===== Membership =====
                const membership = await tx.tenantMembership.create({
                    data: {
                        tenantId: tenant.id,
                        userId: adminUser.id,
                        partnerId: businessPartner.id,
                        category: MembershipCategory.ADMIN, // ejemplo, depende de tu enum real
                        isActive: true,
                    },
                });

                // ===== Roles =====
                const createdRoles: Array<{ id: string; key: string }> = [];

                // 1) Recolectar todos los permission keys únicos de una sola vez
                const allPermissionKeys = Array.from(
                    new Set(
                        data.roles.roles.flatMap((role) => role.permissions)
                    )
                );

                // 2) Cargar todos los permisos necesarios en una sola query
                const permissionRecords = allPermissionKeys.length
                    ? await tx.permission.findMany({
                        where: { key: { in: allPermissionKeys } },
                        select: { id: true, key: true },
                    })
                    : [];

                // 3) Mapa key -> permissionId
                const permissionMap = new Map<string, string>(
                    permissionRecords.map((p) => [p.key, p.id])
                );

                // 4) Validación global de permisos faltantes
                const missingPermissionKeys = allPermissionKeys.filter(
                    (key) => !permissionMap.has(key)
                );

                if (missingPermissionKeys.length > 0) {
                    throw new Error(
                        `MISSING_SYSTEM_PERMISSIONS: ${missingPermissionKeys.join(", ")}`
                    );
                }

                // 5) Crear roles y asignar permisos usando el mapa ya cargado
                for (const role of data.roles.roles) {
                    const createdRole = await tx.role.create({
                        data: {
                            tenantId: tenant.id,
                            name: role.name,
                            key: role.key,
                            isSystem: role.isSystem,
                        },
                        select: {
                            id: true,
                            key: true,
                        },
                    });

                    createdRoles.push(createdRole);

                    if (role.permissions.length > 0) {
                        const missingKeysForRole = role.permissions.filter(
                            (key) => !permissionMap.has(key)
                        );

                        if (missingKeysForRole.length > 0) {
                            throw new Error(
                                `MISSING_PERMISSION_FOR_ROLE_${role.key}: ${missingKeysForRole.join(", ")}`
                            );
                        }

                        const rolePermissionData = role.permissions.map((key) => {
                            const permissionId = permissionMap.get(key);
                            if (!permissionId) {
                                throw new Error(`MISSING_PERMISSION_FOR_ROLE_${role.key}: ${key}`);
                            }

                            return {
                                roleId: createdRole.id,
                                permissionId,
                            };
                        });

                        await tx.rolePermission.createMany({
                            data: rolePermissionData,
                            skipDuplicates: true,
                        });
                    }
                }

                // 6) Buscar el rol administrativo asignado al admin inicial
                const adminRole = createdRoles.find(
                    (r) => r.key === data.roles.adminAssignedRoleKey
                );

                if (!adminRole) {
                    throw new Error("ADMIN_ASSIGNED_ROLE_NOT_FOUND");
                }

                // 7) Asignar ese rol a la membership del admin inicial
                await tx.membershipRole.create({
                    data: {
                        membershipId: membership.id,
                        roleId: adminRole.id,
                    },
                });

                // ===== Plan / subscription =====
                // Ajusta estos nombres a tus modelos reales
                const plan = await tx.plan.findUnique({
                    where: { code: data.plan.planCode },
                    select: {
                        id: true,
                        code: true,
                        maxUsers: true,
                        maxProjects: true,
                    },
                });

                if (!plan) {
                    throw new Error(`PLAN_NOT_FOUND: ${data.plan.planCode}`);
                }

                const price = await tx.price.findUnique({
                    where: {
                        planId_currencyCode_interval: {
                            planId: plan.id,
                            currencyCode: "USD",
                            interval: data.plan.subscriptionPreview.billingInterval,
                        },
                    },
                    select: {
                        id: true,
                        amountCents: true,
                        currencyCode: true,
                        interval: true,
                    },
                });

                if (!price) {
                    throw new Error(`PRICE_NOT_FOUND_FOR_PLAN: ${plan.code}`);
                }

                let couponId: string | null = null;

                if (data.plan.subscriptionPreview.appliedCouponCode) {
                    const coupon = await tx.coupon.findUnique({
                        where: { code: data.plan.subscriptionPreview.appliedCouponCode },
                        select: { id: true },
                    });

                    couponId = coupon?.id ?? null;
                }

                const now = new Date();

                const trialEndsAt =
                    data.plan.subscriptionPreview.trialDays > 0
                        ? new Date(now.getTime() + data.plan.subscriptionPreview.trialDays * 86400000)
                        : null;

                const subscription = await tx.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        priceId: price.id,

                        status: "ACTIVE",

                        startedAt: now,
                        trialEndsAt,

                        currentPeriodStart:
                            price.interval === "LIFETIME" ? null : now,

                        currentPeriodEnd: null,
                        canceledAt: null,

                        // snapshots
                        priceAmountCentsSnapshot:
                            data.plan.subscriptionPreview.finalPriceCents,

                        currencyCodeSnapshot:
                            data.plan.subscriptionPreview.currencyCode,

                        billingIntervalSnapshot:
                            data.plan.subscriptionPreview.billingInterval,

                        maxUsersSnapshot: plan.maxUsers,
                        maxProjectsSnapshot: plan.maxProjects,

                        couponId,

                        billingProvider: null,
                        billingCustomerId: null,
                        billingSubscriptionId: null,
                        billingSubscriptionItemId: null,
                    },
                });

                if (couponId) {
                    await tx.discount.create({
                        data: {
                            subscriptionId: subscription.id,
                            couponId,
                            percentOff: data.plan.subscriptionPreview.percentOff ?? null,
                            amountOff: data.plan.subscriptionPreview.amountOffCents ?? null,
                            startsAt: now,
                            endsAt: null,
                        },
                    });
                }

                return {
                    tenantId: tenant.id,
                    slug: tenant.slug,
                    adminEmail: adminUser.email,
                };

            },
            {
                timeout: 20000, // 20 segundos
                maxWait: 10000, // 10 segundos esperando conexión
            })
        await prisma.provisioningRequest.update({
            where: { id: provisioning.id },
            data: {
                status: "SUCCESS",
                tenantId: result.tenantId,
                tenantSlug: result.slug,
                resultJson: result,
                finishedAt: new Date(),
            },
        });

        return NextResponse.json({
            ok: true,
            tenantId: result.tenantId,
            slug: result.slug,
            dashboardUrl: `https://${result.slug}.${domain}`,
        });
    } catch (error: any) {
        const message =
            error instanceof Error ? error.message : "Provisioning failed";

        if (requestKey) {
            await prisma.provisioningRequest.updateMany({
                where: { requestKey },
                data: {
                    status: "FAILED",
                    errorCode: "PROVISION_FAILED",
                    errorMessage: message,
                    finishedAt: new Date(),
                },
            });
        }

        console.error("Provisioning error:", error);

        return NextResponse.json(
            {
                ok: false,
                code: "PROVISION_FAILED",
                message: "No fue posible aprovisionar el tenant.",
                detail: message,
            },
            { status: 500 }
        );

    }
}