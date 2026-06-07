/**
 * Dosing calculation helpers.
 */

/**
 * Compute the daily dose in mg per kg of body weight.
 *
 * Returns the raw (unrounded) number so callers can choose their own
 * formatting / rounding.
 *
 * Returns null when any required input is missing, zero, NaN, or
 * unitsPerDay ≤ 0.
 *
 * @param unitsPerDay  Number of dose units given per day (must be > 0).
 * @param strengthMg   Strength of each unit in milligrams.
 * @param weightKg     Patient weight in kilograms.
 */
export function mgPerKg(
  unitsPerDay: number,
  strengthMg: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (!Number.isFinite(unitsPerDay) || unitsPerDay <= 0) return null;
  if (strengthMg == null || !Number.isFinite(strengthMg) || strengthMg === 0)
    return null;
  if (weightKg == null || !Number.isFinite(weightKg) || weightKg === 0)
    return null;

  return (unitsPerDay * strengthMg) / weightKg;
}
