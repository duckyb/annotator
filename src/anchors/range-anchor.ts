/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserRange, NormalizedRange, SerializedRange } from '../ranges';
import type { RangeSelector, RangeSelectorWithType } from '../types';

interface RangeSelectorWithAttributes extends RangeSelectorWithType {
  startContainerPageXPath?: string;
  endContainerPageXPath?: string;
}

/**
 * Converts between `RangeSelector` selectors and `Range` objects.
 */
export class RangeAnchor {
  /**
   * @param {Node} root - A root element from which to anchor.
   * @param {AnyRangeType} range -  A range describing the anchor.
   */
  constructor(
    public root: HTMLElement,
    public range: any
  ) {
    this.root = root;
    this.range = RangeAnchor.sniff(range, this.root);
  }

  /**
   * @param {Node} root -  A root element from which to anchor.
   * @param {AnyRangeType} range -  A range describing the anchor.
   */
  static fromRange(root: HTMLElement, range: any) {
    return new RangeAnchor(root, range);
  }

  /**
   * Create an anchor from a serialized `RangeSelector` selector.
   *
   * @param {Node} root -  A root element from which to anchor.
   * @param {RangeSelector} selector
   */
  static fromSelector(root: HTMLElement, selector: RangeSelector) {
    const range = new SerializedRange(selector);
    return new RangeAnchor(root, range);
  }

  /**
   * Determines the type of Range of the provided object and returns
   * a suitable Range instance.
   *
   * r - A range Object.
   *
   * Examples
   *
   *   selection = window.getSelection()
   *   Range.sniff(selection.getRangeAt(0))
   *   # => Returns a BrowserRange instance.
   *
   * Returns a Range object or false.
   * */
  static sniff(range: any, root: HTMLElement): NormalizedRange {
    // order matters
    let serializedRange;
    let browserRange;
    let normalizedRange;
    if (range.commonAncestorContainer !== undefined) {
      // return new BrowserRange(range);
      browserRange = new BrowserRange(range).normalize();
      normalizedRange = new NormalizedRange(browserRange);
    } else if (typeof range.startContainer === 'string') {
      // return new SerializedRange(range);
      serializedRange = new SerializedRange(range).normalize(root);
      browserRange = new BrowserRange(serializedRange).normalize();
      normalizedRange = new NormalizedRange(browserRange);
    } else if (
      range.startContainer &&
      typeof range.startContainer === 'object'
    ) {
      // return new NormalizedRange(range);
      normalizedRange = new NormalizedRange(range);
    }
    if (!normalizedRange) {
      throw new Error('Could not sniff range type');
    }
    return normalizedRange;
  }

  toRange() {
    return this.range.toRange();
  }

  private findPageXPath(element: Node): string | undefined {
    let current: Node | null = element;
    while (current && current instanceof Element) {
      const xpath = current.getAttribute('data-page-xpath');
      if (xpath) {
        return xpath;
      }
      current = current.parentElement;
    }
    return undefined;
  }

  /**
   * @return {RangeSelector}
   */
  toSelector(): RangeSelectorWithAttributes {
    const params = this.range.serialize(this.root);
    const range = new SerializedRange(params);

    // Get the actual range to find the elements
    const domRange = this.range.toRange();
    return {
      type: 'RangeSelector',
      startContainer: range.startContainer as string,
      startOffset: range.startOffset,
      endContainer: range.endContainer as string,
      endOffset: range.endOffset,
      startContainerPageXPath: this.findPageXPath(domRange.startContainer),
      endContainerPageXPath: this.findPageXPath(domRange.endContainer),
    };
  }
}
