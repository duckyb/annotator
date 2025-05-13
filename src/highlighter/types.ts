/**
 * Extension of HTMLElement with additional properties for highlight functionality
 */
export interface HighlightElement extends HTMLElement {
  svgHighlight: SVGElement | null;
}

/**
 * Parameters for highlight functions
 */
export interface HighlightParams {
  /** The range to highlight */
  range: Range;
  /** HTML tag to use for the highlight element (default: 'span') */
  tag?: string;
  /** CSS class to use for the highlight (default: 'highlight') */
  cssClass?: string;
  /** Optional hex color code for the highlight */
  color?: string;
  /** Whether to allow highlighting of whitespace-only text nodes (default: false) */
  allowWhitespace?: boolean;
}
