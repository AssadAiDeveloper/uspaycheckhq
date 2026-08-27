import { getAllStates, getStateMetadata } from "@/lib/engine/state";
import type { StateCode } from "@/lib/engine/state";

function getTopRate(stateCode: StateCode): number {
  const state = getStateMetadata(stateCode);
  if (!state.hasIncomeTax) return 0;
  if (state.type === "flat") return state.flatRate;
  const brackets = state.brackets.single as { rate: number; min: number }[];
  return Math.max(...brackets.map((b) => b.rate));
}

/**
 * Ranks a state's top marginal income tax rate against all 50 states + DC
 * (1 = highest rate in the country). Used to generate genuinely comparative,
 * non-templated content such as "California has the highest top marginal
 * state income tax rate in the country."
 */
export function getTopRateRank(stateCode: StateCode): {
  rank: number;
  totalTaxingStates: number;
  topRate: number;
} {
  const allStates = getAllStates();
  const ranked = allStates
    .map((s) => ({ code: s.code, rate: getTopRate(s.code) }))
    .filter((s) => s.rate > 0)
    .sort((a, b) => b.rate - a.rate);

  const rank = ranked.findIndex((s) => s.code === stateCode) + 1;
  const topRate = getTopRate(stateCode);

  return {
    rank: rank || ranked.length + 1,
    totalTaxingStates: ranked.length,
    topRate,
  };
}
