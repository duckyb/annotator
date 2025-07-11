/**
 * @fileoverview Browser range normalization utilities for consistent DOM selection handling.
 *
 * This module provides the BrowserRange class which wraps native browser Range objects and
 * normalizes them to ensure consistent behavior across different browsers. The normalization
 * process handles differences in how browsers generate ranges and selections, particularly
 * around text node boundaries and element node containers.
 */

import type { BrowserNormalizedRange } from '../types';
import { getFirstTextNodeNotBefore, getLastTextNodeUpTo } from '../xpath-util';

/**
 * Creates a wrapper around a range object obtained from a DOMSelection.
 */
export class BrowserRange {
  public commonAncestorContainer: Node;

  public startContainer: Node;

  public startOffset: number;

  public endContainer: Node;

  public endOffset: number;

  public tainted = false;

  /**
   * Creates an instance of BrowserRange.
   *
   * object - A range object obtained via DOMSelection#getRangeAt().
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   range = new Range.BrowserRange(selection.getRangeAt(0))
   *
   * Returns an instance of BrowserRange.
   */
  constructor(range: Range) {
    this.commonAncestorContainer = range.commonAncestorContainer;
    this.startContainer = range.startContainer;
    this.startOffset = range.startOffset;
    this.endContainer = range.endContainer;
    this.endOffset = range.endOffset;
  }

  /**
   * normalize works around the fact that browsers don't generate
   * ranges/selections in a consistent manner. Some (Safari) will create
   * ranges that have (say) a textNode startContainer and elementNode
   * endContainer. Others (Firefox) seem to only ever generate
   * textNode/textNode or elementNode/elementNode pairs.
   *
   * Returns a normalized range
   */
  normalize() {
    if (this.tainted) {
      throw new Error('You may only call normalize() once on a BrowserRange!');
    } else {
      this.tainted = true;
    }
    const range = {} as BrowserNormalizedRange;

    // Look at the start
    if (this.startContainer.nodeType === Node.ELEMENT_NODE) {
      // We are dealing with element nodes
      if (this.startOffset < this.startContainer.childNodes.length) {
        const firstTextNode = getFirstTextNodeNotBefore(
          this.startContainer.childNodes[this.startOffset]
        );
        if (!firstTextNode) {
          throw new Error('Could not find text node');
        }
        range.startContainer = firstTextNode;
      } else {
        const firstTextNode = getFirstTextNodeNotBefore(this.startContainer);
        if (!firstTextNode) {
          throw new Error('Could not find text node');
        }
        range.startContainer = firstTextNode;
      }
      range.startOffset = 0;
    } else {
      // We are dealing with simple text nodes
      range.startContainer = this.startContainer;
      range.startOffset = this.startOffset;
    }

    // Look at the end
    if (this.endContainer.nodeType === Node.ELEMENT_NODE) {
      // Get specified node.
      let node = this.endContainer.childNodes[this.endOffset];
      // Does that node exist?
      if (node) {
        // Look for a text node either at the immediate beginning of node
        let n = node;
        while (n && n.nodeType !== Node.TEXT_NODE) {
          n = n.firstChild as ChildNode;
        }
        // Did we find a text node at the start of this element?
        if (n) {
          range.endContainer = n;
          range.endOffset = 0;
        }
      }

      if (!range.endContainer) {
        // We need to find a text node in the previous sibling of the node at the
        // given offset, if one exists, or in the previous sibling of its container.
        if (this.endOffset) {
          node = this.endContainer.childNodes[this.endOffset - 1];
        } else {
          node = this.endContainer.previousSibling as ChildNode;
        }
        const lastTextNode = getLastTextNodeUpTo(node as ChildNode);
        if (!lastTextNode) {
          throw new Error('Could not find text node');
        }
        range.endContainer = lastTextNode;
        range.endOffset = lastTextNode.nodeValue?.length ?? 0;
      }
    } else {
      // We are dealing with simple text nodes
      range.endContainer = this.endContainer;
      range.endOffset = this.endOffset;
    }

    // We have collected the initial data.
    // Now let's start to slice & dice the text elements!
    const normalRange = {} as BrowserNormalizedRange;

    if (range.startOffset > 0) {
      // Do we really have to cut?
      if (
        !range.startContainer.nextSibling ||
        (range.startContainer.nodeValue?.length ?? 0) > range.startOffset
      ) {
        // Yes. Cut.
        normalRange.startContainer = (range.startContainer as Text).splitText(
          range.startOffset
        );
      } else {
        // Avoid splitting off zero-length pieces.
        const nextNode = getFirstTextNodeNotBefore(
          range.startContainer.nextSibling
        );
        if (!nextNode) {
          throw new Error('Could not find next text node');
        }
        normalRange.startContainer = nextNode;
      }
    } else {
      normalRange.startContainer = range.startContainer;
    }

    // Is the whole selection inside one text element?
    if (range.startContainer === range.endContainer) {
      if (
        (normalRange.startContainer.nodeValue?.length ?? 0) >
        range.endOffset - range.startOffset
      ) {
        (normalRange.startContainer as Text).splitText(
          range.endOffset - range.startOffset
        );
      }
      normalRange.endContainer = normalRange.startContainer;
    } else {
      // No, the end of the selection is in a separate text element
      // does the end need to be cut?
      if ((range.endContainer.nodeValue?.length ?? 0) > range.endOffset) {
        (range.endContainer as Text).splitText(range.endOffset);
      }
      normalRange.endContainer = range.endContainer;
    }

    // Make sure the common ancestor is an element node.
    normalRange.commonAncestor = this.commonAncestorContainer;
    while (
      normalRange.commonAncestor &&
      normalRange.commonAncestor?.nodeType !== Node.ELEMENT_NODE
    ) {
      normalRange.commonAncestor = normalRange.commonAncestor
        ?.parentNode as Node;
    }

    return normalRange;
  }
}
