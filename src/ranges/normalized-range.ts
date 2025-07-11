import type { BrowserNormalizedRange } from '../types';
import { getTextNodes, xpathFromNode } from '../xpath-util';
import helpers from '../helpers';

/**
 * A normalized range is most commonly used throughout the annotator.
 * its the result of a deserialized SerializedRange or a BrowserRange without
 * browser inconsistencies.
 */
export class NormalizedRange {
  public commonAncestor: Node;

  public startContainer: Node;

  public endContainer: Node;

  /**
   * Creates an instance of a NormalizedRange.
   *
   * This is usually created by calling the .normalize() method on one of the
   * other Range classes rather than manually.
   *
   * obj - An Object literal. Should have the following properties.
   *       commonAncestor: A Element that encompasses both the startContainer and endContainer nodes
   *       startContainer:          The first TextNode in the range.
   *       endContainer             The last TextNode in the range.
   *
   * Returns an instance of NormalizedRange.
   */
  constructor({
    commonAncestor,
    startContainer,
    endContainer,
  }: BrowserNormalizedRange) {
    this.commonAncestor = commonAncestor as Node;
    this.startContainer = startContainer;
    this.endContainer = endContainer;
  }

  /**
   * Limits the nodes within the NormalizedRange to those contained
   * withing the bounds parameter. It returns an updated range with all
   * properties updated. NOTE: Method returns null if all nodes fall outside
   * of the bounds.
   *
   * bounds - An Element to limit the range to.
   *
   * Returns updated self or null.
   */
  limit(bounds: Node) {
    const nodes = this.textNodes().filter((node) =>
      bounds.contains(node.parentNode)
    );
    if (!nodes.length) {
      return null;
    }

    this.startContainer = nodes[0];
    this.endContainer = nodes[nodes.length - 1];

    const startParents = helpers.parents(this.startContainer as HTMLElement);

    helpers.parents(this.endContainer as HTMLElement).forEach((parent) => {
      if (startParents.indexOf(parent) !== -1) {
        this.commonAncestor = parent;
      }
    });

    return this;
  }

  /**
   * Convert this range into an object consisting of two pairs of (xpath,
   * character offset), which can be easily stored in a database.
   *
   * root - The root Element relative to which XPaths should be calculated
   *
   * Returns SerializedRange constructor params.
   */
  serialize(root?: HTMLElement) {
    const serialization = (node: Node, isEnd?: boolean) => {
      const origParent = node.parentElement;
      const xpath = xpathFromNode(origParent, root ?? document);
      const textNodes = getTextNodes(origParent as Node);
      // Calculate real offset as the combined length of all the
      // preceding textNode siblings. We include the length of the
      // node if it's the end node.
      const nodes = textNodes.slice(0, textNodes.indexOf(node as Text));
      let offset = 0;
      nodes.forEach((n) => {
        offset += n.data.length;
      });

      if (isEnd) {
        return [xpath, offset + (node as Text).data.length];
      }
      return [xpath, offset];
    };

    const start = serialization(this.startContainer);
    const end = serialization(this.endContainer, true);

    return {
      // XPath strings
      startContainer: `${start[0]}`,
      endContainer: `${end[0]}`,
      // Character offsets (integer)
      startOffset: +start[1],
      endOffset: +end[1],
    };
  }

  /**
   * Creates a concatenated String of the contents of all the text nodes
   * within the range.
   *
   * Returns a String.
   */
  text(): string {
    return this.textNodes()
      .map((node) => node.nodeValue)
      .join('');
  }

  /**
   * Fetches only the text nodes within the range.
   *
   * Returns an Array of TextNode instances.
   */
  textNodes() {
    const textNodes = getTextNodes(this.commonAncestor);
    const start = textNodes.indexOf(this.startContainer as Text);
    const end = textNodes.indexOf(this.endContainer as Text);
    // Return the textNodes that fall between the start and end indexes.
    return textNodes.slice(start, +end + 1 || undefined);
  }

  /**
   * Converts the Normalized range to a native browser range.
   *
   * See: https://developer.mozilla.org/en/DOM/range
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   selection.removeAllRanges()
   *   selection.addRange(normedRange.toRange())
   *
   * Returns a Range object.
   */
  toRange(): Range {
    const range = document.createRange();
    range.setStartBefore(this.startContainer);
    range.setEndAfter(this.endContainer);
    return range;
  }
}
