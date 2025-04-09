import { HighlightElement } from '.';
import { removeHighlights } from './removeHighlights';

/**
 * Remove all highlights under a given root element.
 *
 * @param {HTMLElement} root
 */
export function removeAllHighlights(root: HTMLElement) {
  const highlights = Array.from(root.querySelectorAll('highlightTag'));
  removeHighlights(highlights as HighlightElement[]);
}
