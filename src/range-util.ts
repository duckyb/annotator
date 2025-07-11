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
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns true if the start point of a selection occurs after the end point,
 * in document order.
 *
 * @param {Selection} selection
 */
export function isSelectionBackwards(selection: Selection): boolean {
  if (selection.focusNode === selection.anchorNode) {
    return selection.focusOffset < selection.anchorOffset;
  }

  const range = selection.getRangeAt(0);
  return range.startContainer === selection.focusNode;
}

/**
 * Returns true if any part of `node` lies within `range`.
 *
 * @param {Range} range
 * @param {Node} node
 */
export function isNodeInRange(range: Range, node: HTMLElement): boolean {
  try {
    const length = node.nodeValue?.length ?? node.childNodes.length;
    return (
      // Check start of node is before end of range.
      range.comparePoint(node, 0) <= 0 &&
      // Check end of node is after start of range.
      range.comparePoint(node, length) >= 0
    );
  } catch {
    // `comparePoint` may fail if the `range` and `node` do not share a common
    // ancestor or `node` is a doctype.
    return false;
  }
}

/**
 * Iterate over all Node(s) which overlap `range` in document order and invoke
 * `callback` for each of them.
 *
 * @param {Range} range
 * @param {(n: Node) => any} callback
 */
export function forEachNodeInRange(range: Range, callback: (n: Node) => void) {
  const root = range.commonAncestorContainer;
  const nodeIter = root.ownerDocument?.createNodeIterator(
    root,
    NodeFilter.SHOW_ALL
  );
  let currentNode: Node | null;
  while ((currentNode = nodeIter?.nextNode() ?? null)) {
    if (currentNode && isNodeInRange(range, currentNode as HTMLElement)) {
      callback(currentNode);
    }
  }
}

/**
 * Returns the bounding rectangles of non-whitespace text nodes in `range`.
 *
 * @param {Range} range
 * @return {Array<DOMRect>} Array of bounding rects in viewport coordinates.
 */
export function getTextBoundingBoxes(range: Range): DOMRect[] {
  const whitespaceOnly = /^\s*$/;
  const textNodes: Text[] = [];
  forEachNodeInRange(range, (node) => {
    if (
      node.nodeType === Node.TEXT_NODE &&
      !node.textContent?.match(whitespaceOnly)
    ) {
      textNodes.push(node as Text);
    }
  });

  let rects: DOMRect[] = [];
  textNodes.forEach((node) => {
    const nodeRange = node.ownerDocument.createRange();
    nodeRange.selectNodeContents(node);
    if (node === range.startContainer) {
      nodeRange.setStart(node, range.startOffset);
    }
    if (node === range.endContainer) {
      nodeRange.setEnd(node, range.endOffset);
    }
    if (nodeRange.collapsed) {
      // If the range ends at the start of this text node or starts at the end
      // of this node then do not include it.
      return;
    }

    // Measure the range and translate from viewport to document coordinates
    const viewportRects = Array.from(nodeRange.getClientRects());
    nodeRange.detach();
    rects = rects.concat(viewportRects);
  });
  return rects;
}

/**
 * Returns the rectangle, in viewport coordinates, for the line of text
 * containing the focus point of a Selection.
 *
 * Returns null if the selection is empty.
 *
 * @param {Selection} selection
 * @return {DOMRect|null}
 */
export function selectionFocusRect(selection: Selection): DOMRect | null {
  if (selection.isCollapsed) {
    return null;
  }
  const textBoxes = getTextBoundingBoxes(selection.getRangeAt(0));
  if (textBoxes.length === 0) {
    return null;
  }

  if (isSelectionBackwards(selection)) {
    return textBoxes[0];
  }
  return textBoxes[textBoxes.length - 1];
}

/**
 * Retrieve a set of items associated with nodes in a given range.
 *
 * An `item` can be any data that the caller wishes to compute from or associate
 * with a node. Only unique items, as determined by `Object.is`, are returned.
 *
 * @template T
 * @param {Range} range
 * @param {(n: Node) => T} itemForNode - Callback returning the item for a given node
 * @return {T[]} items
 */
export function itemsForRange(
  range: Range,
  itemForNode: (arg0: Node) => any
): any[] {
  const checkedNodes = new Set();
  const items = new Set();

  forEachNodeInRange(range, (node) => {
    let current = node;
    while (current) {
      if (checkedNodes.has(current)) {
        break;
      }
      checkedNodes.add(current);

      const item = itemForNode(current);
      if (item) {
        items.add(item);
      }

      current = current.parentNode as Node;
    }
  });

  return [...items];
}
