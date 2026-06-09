// src/lib/format.ts
// Helpers for safely rendering fields that may come back from the
// backend in inconsistent shapes (string vs object).

import type { EligibilityObject } from "@/types";

/**
 * Normalize the `eligibility` field which the backend may return as
 * either a string or a structured object such as
 * `{ education, age_min, age_max, age_relaxation }`.
 *
 * Returning a plain string avoids React's "Objects are not valid as a
 * React child" runtime error.
 */
export function formatEligibility(
  value: string | EligibilityObject | undefined | null
): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const parts: string[] = [];
  if (value.education) parts.push(`Education: ${value.education}`);
  if (value.age_min !== undefined && value.age_max !== undefined) {
    parts.push(`Age: ${value.age_min} – ${value.age_max} years`);
  } else if (value.age_max !== undefined) {
    parts.push(`Max Age: ${value.age_max} years`);
  } else if (value.age_min !== undefined) {
    parts.push(`Min Age: ${value.age_min} years`);
  }
  if (value.age_relaxation) parts.push(`Age Relaxation: ${value.age_relaxation}`);

  // Fallback: serialize unknown keys so we never render `[object Object]`.
  if (parts.length === 0) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return parts.join(" • ");
}

/**
 * Normalize the `ageLimit` field which may be a string ("18-27")
 * or a structured object ({ min, max, relaxation }).
 */
export function formatAgeLimit(
  value: string | { min?: number; max?: number; relaxation?: string } | undefined | null
): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const parts: string[] = [];
  if (value.min !== undefined && value.max !== undefined) {
    parts.push(`${value.min} – ${value.max} years`);
  } else if (value.max !== undefined) {
    parts.push(`Max ${value.max} years`);
  } else if (value.min !== undefined) {
    parts.push(`Min ${value.min} years`);
  }
  if (value.relaxation) parts.push(`Age Relaxation: ${value.relaxation}`);
  return parts.join(" • ");
}

/** Safely render any value as a string for display. */
export function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
