import type { HighlightElement, HighlightParams } from './types';
import { drawHighlightsAbovePdfCanvas } from './drawHighlightsAbovePdfCanvas';
import { wholeTextNodesInRange } from './wholeTextNodesInRange';
import { hexToRgba } from '../utils/color-utils';

// Using HighlightParams interface from types.ts

/**
 * Wraps the DOM Nodes within the provided range with a highlight
 * element of the specified class and returns the highlight Elements.
 *
 * @param params Parameters for highlighting
 * @return {HighlightElement[]} - Elements wrapping text in range to add a highlight effect
 */
export function highlightRange(params: HighlightParams): HighlightElement[] {
  const {
    range,
    tag = 'span',
    cssClass = 'highlight',
    color,
    allowWhitespace = false
  } = params;
  const textNodes = wholeTextNodesInRange(range);

  // Check if this range refers to a placeholder for not-yet-rendered text in
  // a PDF. These highlights should be invisible.
  const isPlaceholder =
    textNodes.length > 0 &&
    (textNodes[0].parentNode as HTMLElement).closest(
      '.annotator-placeholder'
    ) !== null;

  // Group text nodes into spans of adjacent nodes. If a group of text nodes are
  // adjacent, we only need to create one highlight element for the group.
  let textNodeSpans: Node[][] = [];
  let prevNode: Node | null = null;
  let currentSpan: Node[] | null = null;

  textNodes.forEach((node) => {
    if (prevNode && prevNode.nextSibling === node) {
      currentSpan?.push(node);
    } else {
      currentSpan = [node];
      textNodeSpans.push(currentSpan);
    }
    prevNode = node;
  });

  // Handle whitespace text nodes based on configuration
  const whitespace = /^\s*$/;
  textNodeSpans = textNodeSpans.filter((span) => {
    // Check if this is a whitespace-only span
    const isWhitespaceOnly = !span.some((node) => !whitespace.test(node.nodeValue ?? ''));
    
    if (isWhitespaceOnly) {
      // If whitespace highlighting is disabled, filter out all whitespace-only spans
      if (!allowWhitespace) {
        return false;
      }
      
      // Even if whitespace highlighting is enabled, we still need to check
      // if the parent allows arbitrary spans to avoid invalid HTML
      const parent = span[0].parentNode;
      if (!parent) return false;

      // Check the immediate parent - this is more precise than checking all ancestors
      const parentEl = parent as HTMLElement;
      const tagName = parentEl.tagName;

      // These are the specific elements that directly restrict their children
      // and where spans would be invalid as direct children
      const directlyRestrictedParents = [
        'TABLE',
        'THEAD',
        'TBODY',
        'TFOOT',
        'TR',
        'UL',
        'OL',
        'SELECT',
        'DL',
      ];

      // Only filter out whitespace in contexts where spans are directly invalid
      if (directlyRestrictedParents.includes(tagName)) {
        return false;
      }
      
      // If we're here, the context is safe for whitespace highlighting
      return true;
    }

    // Non-whitespace spans are always kept
    return true;
  });

  // Wrap each text node span with a `<highlight-tag>` element.
  const highlights: HighlightElement[] = [];
  textNodeSpans.forEach((nodes) => {
    // A custom element name is used here rather than `<span>` to reduce the
    // likelihood of highlights being hidden by page styling.

    const highlightEl = document.createElement(tag) as HighlightElement;
    highlightEl.className = cssClass;
    highlightEl.setAttribute('part', cssClass);

    // Apply inline styles if a color is provided
    if (color) {
      const backgroundColor = hexToRgba(color);

      highlightEl.style.backgroundColor = backgroundColor;
      highlightEl.setAttribute('data-highlight-color', color);
    }

    nodes[0].parentNode?.replaceChild(highlightEl, nodes[0]);
    nodes.forEach((node) => highlightEl.appendChild(node));

    if (!isPlaceholder) {
      // For PDF highlights, create the highlight effect by using an SVG placed
      // above the page's canvas rather than CSS `background-color` on the
      // highlight element. This enables more control over blending of the
      // highlight with the content below.
      const svgHighlight = drawHighlightsAbovePdfCanvas(highlightEl);
      if (svgHighlight) {
        highlightEl.className += ' is-transparent';

        // Associate SVG element with highlight for use by `removeHighlights`.
        highlightEl.svgHighlight = svgHighlight;
      }
    }

    highlights.push(highlightEl);
  });

  return highlights;
}
