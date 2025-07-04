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
 * Portions of this code are also derived from dom-anchor-text-position
 * https://github.com/tilgovi/dom-anchor-text-position
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

import type { TextPositionSelectorWithType } from '../types';

export class TextPositionAnchor {
  /**
   * @param {Node|TextContentNode} root
   * @param {number} start
   * @param {number} end
   */
  constructor(
    public root: HTMLElement,
    public start: number,
    public end: number
  ) {
    this.root = root;
    this.start = start;
    this.end = end;
  }

  // Method removed as it was unused

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

    // Get text content from the container
    let start = 0;
    let end = 0;

    // Walk through text nodes to find positions
    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT
    );
    let node;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        start += range.startOffset;
        break;
      }
      start += node.textContent?.length || 0;
    }

    while (node && node !== range.endContainer) {
      node = walker.nextNode();
      if (node && node !== range.endContainer) {
        end += node.textContent?.length || 0;
      }
    }
    if (node === range.endContainer) {
      end += range.endOffset;
    }

    return new TextPositionAnchor(containerElement, start, end);
  }

  /**
   * @param {Node} root
   * @param {TextPositionSelector} selector
   */
  static fromSelector(
    root: HTMLElement,
    selector: TextPositionSelectorWithType
  ) {
    return new TextPositionAnchor(root, selector.start, selector.end);
  }

  /**
   * @return {TextPositionSelector}
   */
  toSelector(): TextPositionSelectorWithType {
    return {
      type: 'TextPositionSelector',
      start: this.start,
      end: this.end,
    };
  }

  toRange() {
    // Create a range for the found position
    const range = document.createRange();
    let currentPos = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;

    // Walk through text nodes to find the start and end positions
    const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeLength = node.textContent?.length || 0;

      // Found start node
      if (!startNode && currentPos + nodeLength > this.start) {
        startNode = node;
        startOffset = this.start - currentPos;
      }

      // Found end node
      if (!endNode && currentPos + nodeLength >= this.end) {
        endNode = node;
        endOffset = this.end - currentPos;
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
}
