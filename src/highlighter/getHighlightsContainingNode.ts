import { HighlightElement } from '.';

/**
 * Get the highlight elements that contain the given node.
 *
 * @param {Node} node
 * @return {HighlightElement[]}
 */
export function getHighlightsContainingNode(
  node: HTMLElement
): HighlightElement[] {
  let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

  const highlights = [];

  while (el) {
    if (el.classList.contains('highlightTag')) {
      highlights.push(el as HighlightElement);
    }
    el = el.parentElement;
  }

  return highlights as HighlightElement[];
}
