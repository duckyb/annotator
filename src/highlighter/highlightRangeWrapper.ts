/**
 * This module provides a wrapper for the highlightRange function that handles the common
 * challenge of extracting a valid HTMLElement from a Range object.
 *
 * Why this wrapper exists:
 * 1. The Range.commonAncestorContainer property can return either an Element or a Text node
 * 2. The highlightRange function needs an HTMLElement to work with
 * 3. This wrapper safely handles the conversion, ensuring we always pass a valid HTMLElement
 * 4. It provides a safety check for cases where a valid element cannot be determined
 *
 * Without this wrapper, code that uses highlightRange would need to duplicate this
 * conversion logic everywhere.
 */
import { highlightRange } from './highlightRange';
import type { HighlightElement, HighlightParams } from './types';

/**
 * Wrapper for highlightRange that handles extracting the common ancestor container
 * and ensuring it's an HTMLElement before passing to the original highlightRange function.
 *
 * This function performs these key operations:
 * 1. Extracts the common ancestor container from the Range object
 * 2. Determines if it's an Element node or a Text node
 * 3. If it's a Text node, gets its parent Element
 * 4. Validates that we have a valid HTMLElement to work with
 * 5. Calls the underlying highlightRange function with the processed parameters
 *
 * @param params Parameters for highlighting (see HighlightParams interface)
 * @returns Array of highlight elements, or an empty array if no valid element could be found
 */
export function highlightRangeWrapper(
  params: HighlightParams
): HighlightElement[] {
  const {
    range,
    tag = 'span',
    cssClass = 'highlight',
    color,
    allowWhitespace = false,
  } = params;
  // Get the common ancestor container from the range
  const container = range.commonAncestorContainer;

  // If the container is an element node, use it directly
  // Otherwise, use its parent node which should be an element
  const element =
    container.nodeType === Node.ELEMENT_NODE
      ? (container as HTMLElement)
      : container.parentElement;

  // If we couldn't get a valid element, return an empty array
  if (!element) {
    return [];
  }

  // Call the original highlightRange with the parameters as a single object
  return highlightRange({
    range,
    tag,
    cssClass,
    color,
    allowWhitespace,
  });
}
