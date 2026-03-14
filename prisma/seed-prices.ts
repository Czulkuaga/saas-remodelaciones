// prisma/seed.ts
import "dotenv/config";

import {
    BillingInterval,
    CouponDuration,
    CouponType,
} from "../generated/prisma/enums";
import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs";

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

async function seedCatalogs() {
    // -------------------------
    // CURRENCIES
    // -------------------------
    await prisma.currency.upsert({
        where: { code: "USD" },
        update: {},
        create: {
            code: "USD",
            name: "US Dollar",
            symbol: "$",
            decimals: 2,
            isActive: true,
        },
    });

    await prisma.currency.upsert({
        where: { code: "EUR" },
        update: {},
        create: {
            code: "EUR",
            name: "Euro",
            symbol: "€",
            decimals: 2,
            isActive: true,
        },
    });

    await prisma.currency.upsert({
        where: { code: "COP" },
        update: {},
        create: {
            code: "COP",
            name: "Peso colombiano",
            symbol: "$",
            decimals: 0,
            isActive: true,
        },
    });

    // -------------------------
    // COUNTRIES
    // -------------------------
    await prisma.country.upsert({
        where: { code: "CO" },
        update: {},
        create: {
            code: "CO",
            name: "Colombia",
            euMember: false,
            isActive: true,
            currencyCode: "COP",
        },
    });

    await prisma.country.upsert({
        where: { code: "US" },
        update: {},
        create: {
            code: "US",
            name: "United States",
            euMember: false,
            isActive: true,
            currencyCode: "USD",
        },
    });

    await prisma.country.upsert({
        where: { code: "ES" },
        update: {},
        create: {
            code: "ES",
            name: "España",
            euMember: true,
            isActive: true,
            currencyCode: "EUR",
        },
    });

    await prisma.country.upsert({
        where: { code: "BE" },
        update: {},
        create: {
            code: "BE",
            name: "Belgium",
            euMember: true,
            isActive: true,
            currencyCode: "EUR",
        },
    });

    // -------------------------
    // LOCALES
    // -------------------------
    await prisma.locale.upsert({
        where: { code: "es-CO" },
        update: {},
        create: {
            code: "es-CO",
            language: "es",
            region: "CO",
            name: "Español (Colombia)",
            isActive: true,
        },
    });

    await prisma.locale.upsert({
        where: { code: "es-ES" },
        update: {},
        create: {
            code: "es-ES",
            language: "es",
            region: "ES",
            name: "Español (España)",
            isActive: true,
        },
    });

    await prisma.locale.upsert({
        where: { code: "en-US" },
        update: {},
        create: {
            code: "en-US",
            language: "en",
            region: "US",
            name: "English (United States)",
            isActive: true,
        },
    });

    await prisma.locale.upsert({
        where: { code: "fr-BE" },
        update: {},
        create: {
            code: "fr-BE",
            language: "fr",
            region: "BE",
            name: "Français (Belgique)",
            isActive: true,
        },
    });

    await prisma.locale.upsert({
        where: { code: "nl-BE" },
        update: {},
        create: {
            code: "nl-BE",
            language: "nl",
            region: "BE",
            name: "Nederlands (België)",
            isActive: true,
        },
    });

    // -------------------------
    // TIME ZONES
    // -------------------------
    await prisma.timeZone.upsert({
        where: { id: "America/Bogota" },
        update: {},
        create: {
            id: "America/Bogota",
            label: "America/Bogota",
            isActive: true,
        },
    });

    await prisma.timeZone.upsert({
        where: { id: "America/New_York" },
        update: {},
        create: {
            id: "America/New_York",
            label: "America/New_York",
            isActive: true,
        },
    });

    await prisma.timeZone.upsert({
        where: { id: "Europe/Madrid" },
        update: {},
        create: {
            id: "Europe/Madrid",
            label: "Europe/Madrid",
            isActive: true,
        },
    });

    await prisma.timeZone.upsert({
        where: { id: "Europe/Brussels" },
        update: {},
        create: {
            id: "Europe/Brussels",
            label: "Europe/Brussels",
            isActive: true,
        },
    });
}

async function seedPlansPricesCoupons() {
    // -------------------------
    // PLANS
    // -------------------------
    const trialPlan = await prisma.plan.upsert({
        where: { code: "TRIAL" },
        update: {
            name: "Trial",
            description: "30 días gratis para probar la plataforma",
            isActive: true,
            maxUsers: 2,
            maxProjects: 3,
        },
        create: {
            code: "TRIAL",
            name: "Trial",
            description: "30 días gratis para probar la plataforma",
            isActive: true,
            maxUsers: 2,
            maxProjects: 3,
        },
    });

    const professionalPlan = await prisma.plan.upsert({
        where: { code: "PROFESSIONAL" },
        update: {
            name: "Professional",
            description: "Plan profesional mensual",
            isActive: true,
            maxUsers: 10,
            maxProjects: 25,
        },
        create: {
            code: "PROFESSIONAL",
            name: "Professional",
            description: "Plan profesional mensual",
            isActive: true,
            maxUsers: 10,
            maxProjects: 25,
        },
    });

    const enterprisePlan = await prisma.plan.upsert({
        where: { code: "ENTERPRISE" },
        update: {
            name: "Enterprise",
            description: "Plan enterprise mensual",
            isActive: true,
            maxUsers: 30,
            maxProjects: 200,
        },
        create: {
            code: "ENTERPRISE",
            name: "Enterprise",
            description: "Plan enterprise mensual",
            isActive: true,
            maxUsers: 30,
            maxProjects: 200,
        },
    });

    const unlimitedPlan = await prisma.plan.upsert({
        where: { code: "UNLIMITED" },
        update: {
            name: "Unlimited",
            description: "Licencia gratuita vitalicia. Máximo 5 tenants en toda la plataforma.",
            isActive: true,
            maxUsers: null,
            maxProjects: null,
        },
        create: {
            code: "UNLIMITED",
            name: "Unlimited",
            description: "Licencia gratuita vitalicia. Máximo 5 tenants en toda la plataforma.",
            isActive: true,
            maxUsers: null,
            maxProjects: null,
        },
    });

    // -------------------------
    // PRICES
    // -------------------------
    await prisma.price.upsert({
        where: {
            planId_currencyCode_interval: {
                planId: trialPlan.id,
                currencyCode: "USD",
                interval: BillingInterval.MONTH,
            },
        },
        update: {
            amountCents: 0,
            isActive: true,
        },
        create: {
            planId: trialPlan.id,
            amountCents: 0,
            currencyCode: "USD",
            interval: BillingInterval.MONTH,
            isActive: true,
        },
    });

    await prisma.price.upsert({
        where: {
            planId_currencyCode_interval: {
                planId: professionalPlan.id,
                currencyCode: "USD",
                interval: BillingInterval.MONTH,
            },
        },
        update: {
            amountCents: 19900,
            isActive: true,
        },
        create: {
            planId: professionalPlan.id,
            amountCents: 19900,
            currencyCode: "USD",
            interval: BillingInterval.MONTH,
            isActive: true,
        },
    });

    await prisma.price.upsert({
        where: {
            planId_currencyCode_interval: {
                planId: enterprisePlan.id,
                currencyCode: "USD",
                interval: BillingInterval.MONTH,
            },
        },
        update: {
            amountCents: 49900,
            isActive: true,
        },
        create: {
            planId: enterprisePlan.id,
            amountCents: 49900,
            currencyCode: "USD",
            interval: BillingInterval.MONTH,
            isActive: true,
        },
    });

    await prisma.price.upsert({
        where: {
            planId_currencyCode_interval: {
                planId: unlimitedPlan.id,
                currencyCode: "USD",
                interval: BillingInterval.LIFETIME,
            },
        },
        update: {
            amountCents: 0,
            isActive: true,
        },
        create: {
            planId: unlimitedPlan.id,
            amountCents: 0,
            currencyCode: "USD",
            interval: BillingInterval.LIFETIME,
            isActive: true,
        },
    });

    // -------------------------
    // COUPONS
    // -------------------------
    await prisma.coupon.upsert({
        where: { code: "BETA50" },
        update: {
            type: CouponType.PERCENT,
            percentOff: 50,
            amountOffCents: null,
            duration: CouponDuration.FOREVER,
            durationMonths: null,
            maxRedemptions: 100,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
        create: {
            code: "BETA50",
            type: CouponType.PERCENT,
            percentOff: 50,
            amountOffCents: null,
            duration: CouponDuration.FOREVER,
            durationMonths: null,
            maxRedemptions: 100,
            redeemedCount: 0,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
    });

    await prisma.coupon.upsert({
        where: { code: "BETA90" },
        update: {
            type: CouponType.PERCENT,
            percentOff: 100,
            amountOffCents: null,
            duration: CouponDuration.REPEATING,
            durationMonths: 3,
            maxRedemptions: 100,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
        create: {
            code: "BETA90",
            type: CouponType.PERCENT,
            percentOff: 100,
            amountOffCents: null,
            duration: CouponDuration.REPEATING,
            durationMonths: 3,
            maxRedemptions: 100,
            redeemedCount: 0,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
    });

    await prisma.coupon.upsert({
        where: { code: "LAUNCH25" },
        update: {
            type: CouponType.PERCENT,
            percentOff: 25,
            amountOffCents: null,
            duration: CouponDuration.FOREVER,
            durationMonths: null,
            maxRedemptions: 500,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
        create: {
            code: "LAUNCH25",
            type: CouponType.PERCENT,
            percentOff: 25,
            amountOffCents: null,
            duration: CouponDuration.FOREVER,
            durationMonths: null,
            maxRedemptions: 500,
            redeemedCount: 0,
            validFrom: null,
            validUntil: null,
            isActive: true,
        },
    });
}

async function seedSupportUser() {
    const email = process.env.SEED_SUPPORT_EMAIL ?? "ce13sar12@gmail.com";
    const password = process.env.SEED_SUPPORT_PASSWORD ?? "Czuluaga2020*";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { emailNormalized: normalizeEmail(email) },
        update: {
            email: email.trim(),
            emailNormalized: email.trim(),
            name: "Platform Support",
            phone: "3164061498",
            phoneNormalized: "3164061498",
            isActive: true,
            passwordHash,
        },
        create: {
            email: email.trim(),
            emailNormalized: email.trim(),
            name: "Platform Support",
            phone: "3164061498",
            phoneNormalized: "3164061498",
            isActive: true,
            passwordHash,
        },
    });
}

async function main() {
    console.log("🌱 Seeding catalogs...");
    await seedCatalogs();

    console.log("🌱 Seeding plans, prices and coupons...");
    await seedPlansPricesCoupons();

    console.log("🌱 Seeding support user...");
    await seedSupportUser();

    console.log("✅ Seed completed successfully");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });