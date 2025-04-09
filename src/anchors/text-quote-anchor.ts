import type { QuerySelectorOptions, TextQuoteSelectorWithType } from '../types';
import { TextPositionAnchor } from './text-position-anchor';

// The DiffMatchPatch bitap has a hard 32-character pattern length limit.
const SLICE_LENGTH = 32;
const SLICE_RE = new RegExp('(.|[\r\n]){1,' + String(SLICE_LENGTH) + '}', 'g');
const CONTEXT_LENGTH = SLICE_LENGTH;

/**
 * Converts between `TextQuoteSelector` selectors and `Range` objects.
 */
export class TextQuoteAnchor {
  /**
   * @param {Node|TextContentNode} root - A root element from which to anchor.
   * @param {string} exact
   * @param {Object} context
   *   @param {string} [context.prefix]
   *   @param {string} [context.suffix]
   */
  constructor(
    public root: HTMLElement,
    public exact: string,
    public context: {
      prefix?: string;
      suffix?: string;
    } = {}
  ) {
    this.root = root;
    this.exact = exact;
    this.context = context;
  }

  /**
   * Normalize text content while preserving meaningful structure
   */
  private static normalizeText(text: string): string {
    return (
      text
        // First combine all whitespace (including newlines) into single spaces
        .replace(/\s+/g, ' ')
        // Trim start/end
        .trim()
    );
  }

  /**
   * Get text content from a specific node and its descendants
   */
  private static getTextContent(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return this.normalizeText(node.textContent || '');
    }

    let text = '';
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      text += currentNode.textContent;
    }
    return this.normalizeText(text);
  }

  /**
   * @param {Node} root
   * @param {Range} range
   */
  static fromRange(_: HTMLElement, range: Range) {
    // Get the common ancestor container of the range
    const container = range.commonAncestorContainer;
    const containerElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement);

    if (!containerElement) {
      throw new Error('Could not find container element');
    }

    // Get normalized text content from the container
    const containerText = this.getTextContent(containerElement);

    // Get normalized exact text from the range
    const exact = this.normalizeText(range.toString());

    // Find the position of exact text in the normalized container text
    const exactStart = containerText.indexOf(exact);
    if (exactStart === -1) {
      console.warn('Normalized text not found, trying with raw text');
      // If normalized text not found, try with raw text
      const rawText = containerElement.textContent || '';
      const rawExact = range.toString();
      const rawStart = rawText.indexOf(rawExact);
      if (rawStart === -1) {
        throw new Error('Could not find exact text in container');
      }
      // Use raw text for everything
      const prefixStart = Math.max(0, rawStart - CONTEXT_LENGTH);
      const prefix = rawText.substring(prefixStart, rawStart).trim();
      const suffixEnd = Math.min(
        rawText.length,
        rawStart + rawExact.length + CONTEXT_LENGTH
      );
      const suffix = rawText
        .substring(rawStart + rawExact.length, suffixEnd)
        .trim();
      return new TextQuoteAnchor(containerElement, rawExact, {
        prefix,
        suffix,
      });
    }

    // Extract context without overlapping the exact text
    const prefixStart = Math.max(0, exactStart - CONTEXT_LENGTH);
    const prefix = containerText.substring(prefixStart, exactStart).trim();

    const exactEnd = exactStart + exact.length;
    const suffixEnd = Math.min(containerText.length, exactEnd + CONTEXT_LENGTH);
    const suffix = containerText.substring(exactEnd, suffixEnd).trim();

    return new TextQuoteAnchor(containerElement, exact, { prefix, suffix });
  }

  /**
   * @param {Node} root
   * @param {TextQuoteSelector} selector
   */
  static fromSelector(root: HTMLElement, selector: TextQuoteSelectorWithType) {
    return new TextQuoteAnchor(root, selector.exact, {
      prefix: selector.prefix,
      suffix: selector.suffix,
    });
  }

  /**
   * @return {TextQuoteSelector}
   */
  toSelector(): TextQuoteSelectorWithType {
    return {
      type: 'TextQuoteSelector',
      exact: this.exact,
      prefix: this.context.prefix,
      suffix: this.context.suffix,
    };
  }

  /**
   * Split text into slices that are at most SLICE_LENGTH characters long
   */
  private getTextSlices(text: string): string[] {
    return text.match(SLICE_RE) || [];
  }

  /**
   * Find the position of a pattern in text, checking each slice separately
   */
  private findPattern(text: string, pattern: string, startPos = 0): number {
    // If pattern is longer than SLICE_LENGTH, split it into slices
    const patternSlices = this.getTextSlices(pattern);
    if (patternSlices.length === 0) return -1;

    // Find the first slice
    const pos = text.indexOf(patternSlices[0], startPos);
    if (pos === -1) return -1;

    // If we have more slices, verify they all match
    if (patternSlices.length > 1) {
      const fullMatch = text.substr(pos, pattern.length);
      if (fullMatch !== pattern) {
        // Try again from the next position
        return this.findPattern(text, pattern, pos + 1);
      }
    }

    return pos;
  }

  /**
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   */
  toRange(_options: QuerySelectorOptions = {}) {
    // Get text content from the root
    const text = TextQuoteAnchor.getTextContent(this.root);

    // Try to find the exact text in the root content
    let start = this.findPattern(text, this.exact);
    if (start === -1) {
      throw new Error('Quote not found');
    }

    // If we have a prefix, verify it matches
    if (this.context.prefix) {
      const expectedPrefix = text.substring(
        Math.max(0, start - this.context.prefix.length),
        start
      );
      if (expectedPrefix !== this.context.prefix) {
        // Try find another match
        start = this.findPattern(text, this.exact, start + 1);
        if (start === -1) {
          throw new Error('Quote not found with matching prefix');
        }
      }
    }

    // If we have a suffix, verify it matches
    const end = start + this.exact.length;
    if (this.context.suffix) {
      const expectedSuffix = text.substring(
        end,
        end + this.context.suffix.length
      );
      if (expectedSuffix !== this.context.suffix) {
        throw new Error('Quote not found with matching suffix');
      }
    }

    // Create a range for the found position
    const range = document.createRange();
    let currentPos = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;

    // Walk through text nodes to find the start and end positions
    const treeWalker = document.createTreeWalker(
      this.root,
      NodeFilter.SHOW_TEXT
    );
    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode;
      const nodeLength = node.textContent?.length || 0;

      // Found start node
      if (!startNode && currentPos + nodeLength > start) {
        startNode = node;
        startOffset = start - currentPos;
      }

      // Found end node
      if (!endNode && currentPos + nodeLength >= end) {
        endNode = node;
        endOffset = end - currentPos;
        break;
      }

      currentPos += nodeLength;
    }

    if (!startNode || !endNode) {
      throw new Error('Could not find text nodes for range');
    }

    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  /**
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   */
  toPositionAnchor(options: QuerySelectorOptions = {}) {
    const range = this.toRange(options);
    return new TextPositionAnchor(
      this.root,
      range.startOffset,
      range.endOffset
    );
  }
}
