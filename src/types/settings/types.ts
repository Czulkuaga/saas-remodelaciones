import type { TenantStatus, PartnerType, PartnerIdentifierType } from "../../../generated/prisma/client";

/** Catálogos */
export type LocaleDTO = {
  code: string;
  name: string;
  isActive: boolean;
};

export type TimeZoneDTO = {
  id: string;
  label: string;
  isActive: boolean;
};

export type CurrencyDTO = {
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
};

export type CountryDTO = {
  code: string;
  name: string;
  isActive: boolean;
};

/** KPI / conteos */
export type TenantSettingsCounts = {
  orgUnits: number;
  locations: number;
  memberships: number;
  remodelingProjects: number;
};

/** Branding */
export type TenantBrandingDTO = {
  logoUrl: string | null;
  logoName: string | null;
};

/** BP principal (empresa del tenant) */
export type TenantOrgBPDTO = {
  id: string;
  code: string;
  type?: PartnerType; // opcional (tu return NO lo incluye, pero el select sí. Puedes ignorarlo o mapearlo.)
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

/** Identificadores del BP */
export type PartnerIdentifierDTO = {
  id: string;
  type: PartnerIdentifierType; // ✅ alineado con Prisma (tu select trae enum)
  value: string;
  countryCode: string | null;
  isPrimary: boolean;
  isVerified: boolean;
};

/** Dirección (Location) - alineado con tu select + mapping */
export type LocationDTO = {
  id: string;
  code: string;
  name: string;

  addressLine1: string | null;
  addressLine2: string | null;
  district: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;

  latitude: string | null;  // ✅ en tu return ya lo conviertes a string
  longitude: string | null; // ✅ en tu return ya lo conviertes a string

  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

/** DTO FINAL: exactamente lo que retorna getTenantSettingsAction() */
export type TenantSettingsDTO = {
  // tenant core
  id: string;
  code: string;
  name: string;
  slug: string;
  status: TenantStatus;

  countryCode: string | null;
  defaultLocaleCode: string;
  defaultTimeZoneId: string;
  defaultCurrencyCode: string;

  createdAt: Date;
  updatedAt: Date;

  counts: TenantSettingsCounts;

  // catalogs
  locales: LocaleDTO[];
  timeZones: TimeZoneDTO[];
  currencies: CurrencyDTO[];
  countries: CountryDTO[];

  // branding
  branding: TenantBrandingDTO | null;
  logoUrl?: string;
  logoName?: string;

  // org BP
  orgBP: TenantOrgBPDTO | null;
  orgIdentifiers: PartnerIdentifierDTO[];
  orgBillingLocation: LocationDTO | null;
};