/**
 * Portions of this code are derived from the Hypothesis client
 * https://github.com/hypothesis/client
 *
 * Copyright (c) 2013-2019 Hypothes.is Project and contributors
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Portions of this code are also derived from dom-anchor-text-quote
 * https://github.com/tilgovi/dom-anchor-text-quote
 *
 * Copyright (c) Randall Leeds
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import type { QuerySelectorOptions, TextQuoteSelectorWithType } from '../types';
import { TextPositionAnchor } from './text-position-anchor';
import { matchQuote } from './match-quote';

export type QuoteMatchOptions = {
  /** Expected position of match in text. See `matchQuote`. */
  hint?: number;
};

const CONTEXT_LENGTH = 32;

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
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   */
  toRange(options: QuerySelectorOptions = {}) {
    return this.toPositionAnchor(options).toRange();
  }

  /**
   * @param {Object} [options]
   *   @param {number} [options.hint] -
   *     Offset hint to disambiguate matches
   */
  toPositionAnchor(options: QuoteMatchOptions = {}) {
    const text = this.root.textContent!;
    const match = matchQuote(text, this.exact, {
      ...this.context,
      hint: options.hint,
    });
    if (!match) {
      throw new Error('Quote not found');
    }
    return new TextPositionAnchor(this.root, match.start, match.end);
  }
}
