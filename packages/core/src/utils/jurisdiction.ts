/**
 * Jurisdiction Detection & Compliance Utility
 *
 * Provides jurisdiction detection for Triggerr's multi-entity structure:
 * - Triggerr Direct LLC (Nevada, US operations)
 * - Parametrigger OÜ (Estonia, EU operations)
 * - Parametrigger Financial Solutions Inc. (Nevada, financial services)
 *
 * Supports regulatory arbitrage strategy and GDPR compliance.
 */

export type Jurisdiction = "US" | "EU" | "GLOBAL";

export interface JurisdictionInfo {
  jurisdiction: Jurisdiction;
  country: string;
  timezone: string;
  locale: string;
  currency: string;
  entity: {
    legal: string;
    brand: string;
    jurisdiction: string;
    compliance: string;
  };
  gdprApplicable: boolean;
  dataRetentionDays: number;
}

// Complete EU country codes (ISO 3166-1 alpha-2)
const EU_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
] as const;

// Estonia-adjacent countries (special handling for proximity)
const ESTONIA_REGION = ["EE", "LV", "LT", "FI", "SE", "PL"] as const;

// US jurisdictions (states and territories)
const US_JURISDICTIONS = [
  "US",
  "PR",
  "VI",
  "GU",
  "MP",
  "AS", // US states handled via US country code
] as const;

/**
 * Detect jurisdiction from HTTP request headers
 * Primary detection via CF-IPCountry (Cloudflare), fallback to other headers
 */
export function detectJurisdiction(request: Request): Jurisdiction {
  // Primary: Cloudflare country header
  const cfCountry = request.headers.get("CF-IPCountry");
  if (cfCountry) {
    return classifyCountry(cfCountry);
  }

  // Fallback: X-Forwarded-For geographic detection
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    // Extract first (original) IP and attempt geographic lookup
    const originIp = xForwardedFor.split(",")[0]?.trim();
    if (originIp) {
      // Note: Would require IP geolocation service in production
      console.warn(
        `[Jurisdiction] CF-IPCountry not available, using fallback for IP: ${originIp}`,
      );
    }
  }

  // Fallback: Accept-Language header analysis
  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const langParts = acceptLanguage.split(",")[0]?.split("-") || [];
    const primaryLang = langParts[0];
    const region = langParts[1];

    if (region && EU_COUNTRIES.includes(region.toUpperCase() as any)) {
      return "EU";
    }
    if (region === "US") {
      return "US";
    }
  }

  // Default: Global (conservative approach)
  return "GLOBAL";
}

/**
 * Classify country code into jurisdiction
 */
export function classifyCountry(countryCode: string): Jurisdiction {
  const upperCode = countryCode.toUpperCase();

  if (EU_COUNTRIES.includes(upperCode as any)) {
    return "EU";
  }

  if (US_JURISDICTIONS.includes(upperCode as any)) {
    return "US";
  }

  return "GLOBAL";
}

/**
 * Get comprehensive jurisdiction information
 */
export function getJurisdictionInfo(
  jurisdiction: Jurisdiction,
  countryCode?: string,
): JurisdictionInfo {
  const country = countryCode?.toUpperCase() || "UNKNOWN";

  switch (jurisdiction) {
    case "EU":
      return {
        jurisdiction: "EU",
        country,
        timezone: getEuropeanTimezone(country),
        locale: getEuropeanLocale(country),
        currency: "EUR",
        entity: {
          legal: "Parametrigger OÜ",
          brand: "Triggerr",
          jurisdiction: "estonia",
          compliance: "gdpr",
        },
        gdprApplicable: true,
        dataRetentionDays: 365, // GDPR standard retention
      };

    case "US":
      return {
        jurisdiction: "US",
        country,
        timezone: "America/New_York", // Default to EST for US operations
        locale: "en-US",
        currency: "USD",
        entity: {
          legal: "Triggerr Direct LLC",
          brand: "Triggerr",
          jurisdiction: "nevada",
          compliance: "insurance-sandbox",
        },
        gdprApplicable: false,
        dataRetentionDays: 2555, // 7 years for US insurance records
      };

    case "GLOBAL":
    default:
      return {
        jurisdiction: "GLOBAL",
        country,
        timezone: "UTC",
        locale: "en-US",
        currency: "USD",
        entity: {
          legal: "Parametrigger Inc.",
          brand: "Triggerr",
          jurisdiction: "nevada",
          compliance: "multi-jurisdictional",
        },
        gdprApplicable: true, // Conservative approach - apply GDPR globally
        dataRetentionDays: 365,
      };
  }
}

/**
 * Get appropriate timezone for European countries
 */
function getEuropeanTimezone(countryCode: string): string {
  const timezoneMap: Record<string, string> = {
    EE: "Europe/Tallinn", // Estonia (primary)
    LV: "Europe/Riga", // Latvia
    LT: "Europe/Vilnius", // Lithuania
    FI: "Europe/Helsinki", // Finland
    SE: "Europe/Stockholm", // Sweden
    DE: "Europe/Berlin", // Germany
    FR: "Europe/Paris", // France
    ES: "Europe/Madrid", // Spain
    IT: "Europe/Rome", // Italy
    NL: "Europe/Amsterdam", // Netherlands
    PL: "Europe/Warsaw", // Poland
    CZ: "Europe/Prague", // Czech Republic
    AT: "Europe/Vienna", // Austria
    CH: "Europe/Zurich", // Switzerland
    UK: "Europe/London", // United Kingdom
    IE: "Europe/Dublin", // Ireland
    PT: "Europe/Lisbon", // Portugal
    GR: "Europe/Athens", // Greece
    HU: "Europe/Budapest", // Hungary
    RO: "Europe/Bucharest", // Romania
    BG: "Europe/Sofia", // Bulgaria
    HR: "Europe/Zagreb", // Croatia
    SI: "Europe/Ljubljana", // Slovenia
    SK: "Europe/Bratislava", // Slovakia
    DK: "Europe/Copenhagen", // Denmark
    NO: "Europe/Oslo", // Norway
  };

  return timezoneMap[countryCode] || "UTC"; // Default to UTC
}

/**
 * Get appropriate locale for European countries
 */
function getEuropeanLocale(countryCode: string): string {
  const localeMap: Record<string, string> = {
    EE: "et-EE", // Estonian (primary)
    LV: "lv-LV", // Latvian
    LT: "lt-LT", // Lithuanian
    FI: "fi-FI", // Finnish
    SE: "sv-SE", // Swedish
    DE: "de-DE", // German
    FR: "fr-FR", // French
    ES: "es-ES", // Spanish
    IT: "it-IT", // Italian
    NL: "nl-NL", // Dutch
    PL: "pl-PL", // Polish
    CZ: "cs-CZ", // Czech
    AT: "de-AT", // Austrian German
    CH: "de-CH", // Swiss German
    UK: "en-GB", // British English
    IE: "en-IE", // Irish English
    PT: "pt-PT", // Portuguese
    GR: "el-GR", // Greek
    HU: "hu-HU", // Hungarian
    RO: "ro-RO", // Romanian
    BG: "bg-BG", // Bulgarian
    HR: "hr-HR", // Croatian
    SI: "sl-SI", // Slovenian
    SK: "sk-SK", // Slovak
    DK: "da-DK", // Danish
    NO: "no-NO", // Norwegian
  };

  return localeMap[countryCode] || "en-US"; // Default to English
}

/**
 * Check if request requires GDPR compliance
 */
export function requiresGDPR(jurisdiction: Jurisdiction): boolean {
  return jurisdiction === "EU" || jurisdiction === "GLOBAL";
}

/**
 * Check if request is from Estonia region (special handling)
 */
export function isEstoniaRegion(countryCode: string): boolean {
  return ESTONIA_REGION.includes(countryCode.toUpperCase() as any);
}

/**
 * Get data retention period based on jurisdiction
 */
export function getDataRetentionDays(jurisdiction: Jurisdiction): number {
  switch (jurisdiction) {
    case "EU":
      return 365; // GDPR standard
    case "US":
      return 2555; // 7 years for insurance records
    case "GLOBAL":
    default:
      return 365; // Conservative approach
  }
}

/**
 * Generate entity-aware API response headers
 */
export function generateEntityHeaders(
  jurisdictionInfo: JurisdictionInfo,
): Record<string, string> {
  return {
    "X-Entity-Legal": jurisdictionInfo.entity.legal,
    "X-Entity-Brand": jurisdictionInfo.entity.brand,
    "X-Entity-Jurisdiction": jurisdictionInfo.entity.jurisdiction,
    "X-Entity-Compliance": jurisdictionInfo.entity.compliance,
    "X-Data-Retention-Days": jurisdictionInfo.dataRetentionDays.toString(),
    "X-GDPR-Applicable": jurisdictionInfo.gdprApplicable.toString(),
    "X-Timezone": jurisdictionInfo.timezone,
    "X-Locale": jurisdictionInfo.locale,
    "X-Currency": jurisdictionInfo.currency,
  };
}

/**
 * Estonia-specific business hour detection
 */
export function isEstonianBusinessHours(timestamp?: Date): boolean {
  const now = timestamp || new Date();
  const estonianTime = new Intl.DateTimeFormat("et-EE", {
    timeZone: "Europe/Tallinn",
    hour: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(
    estonianTime.find((part) => part.type === "hour")?.value || "0",
  );
  const weekday = estonianTime.find((part) => part.type === "weekday")?.value;

  // Estonian business hours: 9:00 - 17:00, Monday - Friday
  const isWeekday = !["Sat", "Sun"].includes(weekday || "");
  const isBusinessHour = hour >= 9 && hour < 17;

  return isWeekday && isBusinessHour;
}

/**
 * Format compliance notice based on jurisdiction
 */
export function getComplianceNotice(jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case "EU":
      return "This service is provided by Parametrigger OÜ, Estonia. Your data is processed in accordance with GDPR.";
    case "US":
      return "This service is provided by Triggerr Direct LLC, Nevada. Insurance services subject to state regulations.";
    case "GLOBAL":
    default:
      return "This service is provided by Parametrigger Inc., Nevada. Global data protection standards apply.";
  }
}
