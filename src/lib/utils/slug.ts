import { getAllStates } from "@/lib/engine/state";
import type { StateCode } from "@/lib/engine/state";

/** Converts "New York" -> "new-york" for use in URL paths. */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const ALL_STATES = getAllStates();

const SLUG_TO_CODE: Record<string, StateCode> = ALL_STATES.reduce(
  (acc, state) => {
    acc[nameToSlug(state.name)] = state.code;
    return acc;
  },
  {} as Record<string, StateCode>
);

const CODE_TO_SLUG: Record<string, string> = ALL_STATES.reduce(
  (acc, state) => {
    acc[state.code] = nameToSlug(state.name);
    return acc;
  },
  {} as Record<string, string>
);

export function slugToStateCode(slug: string): StateCode | undefined {
  return SLUG_TO_CODE[slug];
}

export function stateCodeToSlug(code: StateCode): string {
  return CODE_TO_SLUG[code];
}

export function getAllStateSlugs(): string[] {
  return Object.keys(SLUG_TO_CODE);
}
