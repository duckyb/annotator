/**
 * Common types used across the text-range module
 */

/**
 * Result of resolving a text position to a specific node and offset
 */
export interface ResolvedTextPosition {
  node: Text;
  offset: number;
}
