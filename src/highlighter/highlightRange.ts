import { HighlightElement } from './types';
import { drawHighlightsAbovePdfCanvas } from './drawHighlightsAbovePdfCanvas';
import { wholeTextNodesInRange } from './wholeTextNodesInRange';

/**
 * Wraps the DOM Nodes within the provided range with a highlight
 * element of the specified class and returns the highlight Elements.
 *
 * @param {Range} range - Range to be highlighted
 * @param {string} tag - HTML tag to use for the highlight element
 * @param {string} cssClass - A CSS class to use for the highlight
 * @return {HighlightElement[]} - Elements wrapping text in range to add a highlight effect
 */
export function highlightRange(
  range: Range,
  tag = 'span',
  cssClass = 'highlight'
): HighlightElement[] {
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

  // Filter out text node spans that consist only of white space. This avoids
  // inserting highlight elements in places that can only contain a restricted
  // subset of nodes such as table rows and lists.
  const whitespace = /^\s*$/;
  textNodeSpans = textNodeSpans.filter((span) =>
    // Check for at least one text node with non-space content.
    span.some((node) => !whitespace.test(node.nodeValue ?? ''))
  );

  // Wrap each text node span with a `<highlight-tag>` element.
  const highlights: HighlightElement[] = [];
  textNodeSpans.forEach((nodes) => {
    // A custom element name is used here rather than `<span>` to reduce the
    // likelihood of highlights being hidden by page styling.

    const highlightEl = document.createElement(tag) as HighlightElement;
    highlightEl.className = cssClass;
    highlightEl.setAttribute('part', cssClass);

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
