/**
 * Wrapper for highlightRange to handle Range to HTMLElement conversion
 */
import { highlightRange } from './highlightRange';
import type { HighlightElement } from './types';

/**
 * Wrapper for highlightRange that handles extracting the common ancestor container
 * and ensuring it's an HTMLElement before passing to the original highlightRange function
 * 
 * @param range The range to highlight
 * @param tag HTML tag to use for the highlight element
 * @param cssClass CSS class to use for the highlight
 * @returns Array of highlight elements
 */
export function highlightRangeWrapper(
  range: Range,
  tag = 'span',
  cssClass = 'highlight'
): HighlightElement[] {
  // Get the common ancestor container from the range
  const container = range.commonAncestorContainer;
  
  // If the container is an element node, use it directly
  // Otherwise, use its parent node which should be an element
  const element = container.nodeType === Node.ELEMENT_NODE
    ? container as HTMLElement
    : container.parentElement;
  
  // If we couldn't get a valid element, return an empty array
  if (!element) {
    return [];
  }
  
  // Call the original highlightRange with the HTMLElement
  return highlightRange(range);
}
