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

  /**
   * Get text content from a specific node and its descendants
   */
  private static getTextContent(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    let text = '';
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      text += currentNode.textContent;
    }
    return text;
  }

  /**
   * @param {Node} root
   * @param {Range} range
   */
  static fromRange(root: HTMLElement, range: Range) {
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
