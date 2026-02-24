import "server-only";
import { cache } from "react";
import { getAuthStatus } from "@/lib/auth/session";

export const getAuthStatusCached = cache(async () => {
  return getAuthStatus();
});