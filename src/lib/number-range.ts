// "use server";

// import { prisma } from "@/lib/prisma";
// import { NumberRangeObject } from "../../generated/prisma/client";

// function padLeft(n: number, width: number) {
//     const s = String(n);
//     return s.length >= width ? s : "0".repeat(width - s.length) + s;
// }

// type NextNumberOpts = {
//     tenantId: string;
//     object: NumberRangeObject;
//     // Si no hay registro, se crea con estos defaults
//     defaultPrefix?: string | null;
//     defaultPadding?: number;
//     defaultNextNo?: number; // normalmente 1
// };

// /**
//  * SAP-like number range:
//  * - atomic increment (tx)
//  * - returns formatted code: [prefix]-[paddedNo] (si prefix existe)
//  */
// export async function nextNumberRangeCode(opts: NextNumberOpts): Promise<string> {
//     const {
//         tenantId,
//         object,
//         defaultPrefix = null,
//         defaultPadding = 8,
//         defaultNextNo = 1,
//     } = opts;

//     return prisma.$transaction(async (tx) => {
//         // 1) buscar o crear range
//         const current = await tx.numberRange.findUnique({
//             where: { tenantId_object: { tenantId, object } },
//             select: { id: true, prefix: true, nextNo: true, padding: true },
//         });

//         const range =
//             current ??
//             (await tx.numberRange.create({
//                 data: {
//                     tenantId,
//                     object,
//                     prefix: defaultPrefix,
//                     nextNo: defaultNextNo,
//                     padding: defaultPadding,
//                 },
//                 select: { id: true, prefix: true, nextNo: true, padding: true },
//             }));

//         // 2) tomar número actual y aumentar
//         const currentNo = range.nextNo;

//         await tx.numberRange.update({
//             where: { id: range.id },
//             data: { nextNo: currentNo + 1 },
//         });

//         // 3) formatear código
//         const padded = padLeft(currentNo, range.padding);
//         return range.prefix ? `${range.prefix}${padded}` : padded;
//     });
// }

"use server";

import { prisma } from "@/lib/prisma";
import { NumberRangeObject, PrismaClient, Prisma } from "../../generated/prisma/client";

function padLeft(n: number, width: number) {
    const s = String(n);
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

type TxClient = Prisma.TransactionClient | PrismaClient;

type NextNumberOpts = {
    tenantId: string;
    object: NumberRangeObject;
    defaultPrefix?: string | null;
    defaultPadding?: number;
    defaultNextNo?: number;
    tx?: TxClient;
};

export async function nextNumberRangeCode(opts: NextNumberOpts): Promise<string> {
    const {
        tenantId,
        object,
        defaultPrefix = null,
        defaultPadding = 8,
        defaultNextNo = 1,
        tx,
    } = opts;

    const db = tx ?? prisma;

    const current = await db.numberRange.findUnique({
        where: { tenantId_object: { tenantId, object } },
        select: { id: true, prefix: true, nextNo: true, padding: true },
    });

    const range =
        current ??
        (await db.numberRange.create({
            data: {
                tenantId,
                object,
                prefix: defaultPrefix,
                nextNo: defaultNextNo,
                padding: defaultPadding,
            },
            select: { id: true, prefix: true, nextNo: true, padding: true },
        }));

    const currentNo = range.nextNo;

    await db.numberRange.update({
        where: { id: range.id },
        data: { nextNo: currentNo + 1 },
    });

    const padded = padLeft(currentNo, range.padding);
    return range.prefix ? `${range.prefix}${padded}` : padded;
}