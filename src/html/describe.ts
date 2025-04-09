import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from '../anchors';
import type {
  RangeSelectorWithType,
  TextPositionSelectorWithType,
  TextQuoteSelectorWithType,
} from '../types';

/**
 * @param {Node} root
 * @param {Range} range
 */
export function describe(
  root: Node,
  range: Range
): (
  | RangeSelectorWithType
  | TextPositionSelectorWithType
  | TextQuoteSelectorWithType
)[] {
  const types = [RangeAnchor, TextPositionAnchor, TextQuoteAnchor];
  const result: (
    | RangeSelectorWithType
    | TextPositionSelectorWithType
    | TextQuoteSelectorWithType
  )[] = [];
  types.forEach((type) => {
    try {
      const selectedAnchor = type.fromRange(root as HTMLElement, range);
      result.push(selectedAnchor.toSelector());
    } catch {
      // do nothing
    }
  });
  return result;
}
