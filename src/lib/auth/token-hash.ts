import "server-only";
import crypto from "crypto";

const PEPPER = process.env.AUTH_TOKEN_PEPPER ?? "dev-pepper";

function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

export function tokenHashFromRawToken(token: string) {
    return sha256(`${token}.${PEPPER}`);
}