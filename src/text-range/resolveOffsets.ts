import { ResolvedTextPosition } from './text-range-types';

/**
 * Resolve one or more character offsets within an element to (text node, position)
 * pairs.
 *
 * @param {Element} element
 * @param {number[]} offsets - Offsets, which must be sorted in ascending order
 * @return {ResolvedTextPosition[]}
 */
export function resolveOffsets(element: HTMLElement, ...offsets: number[]): ResolvedTextPosition[] {
  let nextOffset = offsets.shift();
  const nodeIter =
    /** @type {Document} */ element.ownerDocument.createNodeIterator(
      element,
      NodeFilter.SHOW_TEXT
    );
  const results: ResolvedTextPosition[] = [];

  let currentNode = nodeIter.nextNode();
  let textNode;
  let length = 0;

  // Find the text node containing the `nextOffset`th character from the start
  // of `element`.
  while (nextOffset !== undefined && currentNode) {
    textNode = /** @type {Text} */ currentNode;
    if (length + (textNode as Text).data.length > nextOffset) {
      results.push({ node: textNode as Text, offset: nextOffset - length });
      nextOffset = offsets.shift();
    } else {
      currentNode = nodeIter.nextNode();
      length += (textNode as Text).data.length;
    }
  }

  // Boundary case.
  while (nextOffset !== undefined && textNode && length === nextOffset) {
    results.push({ node: textNode as Text, offset: (textNode as Text).data.length });
    nextOffset = offsets.shift();
  }

  if (nextOffset !== undefined) {
    throw new RangeError('Offset exceeds text length');
  }

  return results;
}
