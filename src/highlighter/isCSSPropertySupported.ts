/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Checks if a specific CSS property and value combination is supported in the current browser.
 * This function uses the CSS.supports API when available to perform feature detection.
 *
 * @param {string} property - The CSS property to check (e.g., 'mix-blend-mode')
 * @param {string} value - The value to check for the property (e.g., 'multiply')
 * @returns {boolean} True if the property-value combination is supported, false otherwise
 * @example
 * // Check if mix-blend-mode: multiply is supported
 * if (isCSSPropertySupported('mix-blend-mode', 'multiply')) {
 *   // Use mix-blend-mode
 * } else {
 *   // Use fallback styling
 * }
 */
export function isCSSPropertySupported(
  property: string,
  value: string
): boolean {
  if (
    typeof CSS !== 'function' ||
    typeof (CSS as any).supports !== 'function'
  ) {
    /* istanbul ignore next */
    return false;
  }
  return (CSS as any).supports(property, value);
}
