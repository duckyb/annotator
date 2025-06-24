import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from '../anchors';
import type {
  QuerySelectorOptions,
  SelectorWithType,
  TextPositionSelectorWithType,
  TextQuoteSelectorWithType,
  RangeSelectorWithType,
  RangeSelector,
} from '../types';
import { querySelector } from './querySelector';

/**
 * Anchor a set of selectors.
 *
 * This function converts a set of selectors into a document range.
 * It encapsulates the core anchoring algorithm, using the selectors alone or
 * in combination to establish the best anchor within the document.
 *
 * **Selector Priority Order:**
 * The function tries selectors in the following priority order, falling back to the next
 * selector if the current one fails:
 * 1. **RangeSelector** - Most precise, uses exact DOM node references
 * 2. **TextPositionSelector** - Uses character offsets from document start
 * 3. **TextQuoteSelector** - Uses exact text matching with optional prefix/suffix
 *
 * **Quote Assertion:**
 * When a TextQuoteSelector is present, the function validates that the text content
 * of ranges returned by RangeSelector and TextPositionSelector matches the expected
 * quote text. If the quote doesn't match, it throws a "quote mismatch" error and
 * falls back to the next selector.
 *
 * @param {HTMLElement} root - The root element of the anchoring context.
 * @param {SelectorWithType[]} selectors - The selectors to try in priority order.
 * @param {QuerySelectorOptions} [options] - Optional configuration.
 *   @param {number} [options.hint] - Offset hint to disambiguate matches (used by TextQuoteAnchor).
 * @returns {Promise<{type: string, range: Range}>} Promise resolving to the anchored range with its type.
 * @throws {Error} Throws "unable to anchor" if all selectors fail.
 * @throws {Error} Throws "quote mismatch" if range text doesn't match expected quote.
 *
 * @example
 * ```typescript
 * const selectors = [
 *   { type: 'RangeSelector', startContainer: '0', startOffset: 10, endContainer: '0', endOffset: 20 },
 *   { type: 'TextQuoteSelector', exact: 'selected text', prefix: 'before ', suffix: ' after' }
 * ];
 * const result = await anchor(document.body, selectors);
 * console.log(result.type); // 'range' or 'text-quote' depending on which succeeded
 * ```
 */
export async function anchor(
  root: HTMLElement,
  selectors: SelectorWithType[],
  options: QuerySelectorOptions = {}
) {
  let textPositionSelector: TextPositionSelectorWithType | null = null;
  let textQuoteSelector: TextQuoteSelectorWithType | null = null;
  let rangeSelector: RangeSelectorWithType | null = null;

  // Collect all the selectors
  selectors.forEach((selector: SelectorWithType) => {
    switch (selector.type) {
      case 'TextPositionSelector':
        textPositionSelector = selector;
        options.hint = textPositionSelector.start; // TextQuoteAnchor hint
        break;
      case 'TextQuoteSelector':
        textQuoteSelector = selector;
        break;
      case 'RangeSelector':
        rangeSelector = selector;
        break;
      default:
        break;
    }
  });

  /**
   * Assert the quote matches the stored quote, if applicable
   * @param {Range} range
   */
  const maybeAssertQuote = (range: Range) => {
    if (
      textQuoteSelector?.exact &&
      range.toString() !== textQuoteSelector.exact
    ) {
      throw new Error('quote mismatch');
    } else {
      return range;
    }
  };

  // From a default of failure, we build up catch clauses to try selectors in
  // priority order: Range → Text Position → Text Quote
  // Each selector is tried in sequence, falling back to the next if the current one fails.
  /** @type {Promise<{ type: string; range: Range }>} */
  let promise: Promise<{ type: string; range: Range }> | Promise<never> =
    Promise.reject(Error('unable to anchor'));

  // Priority 1: RangeSelector - Most precise, uses exact DOM node references
  if (rangeSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = RangeAnchor.fromSelector(
        root as HTMLElement,
        rangeSelector as RangeSelector
      );
      return querySelector(selectedAnchor, options)
        .then(maybeAssertQuote)
        .then((range) =>
          Promise.resolve({
            range,
            type: 'range',
          })
        );
    });
  }

  // Priority 2: TextPositionSelector - Uses character offsets from document start
  if (textPositionSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = TextPositionAnchor.fromSelector(
        root as HTMLElement,
        {
          type: 'TextPositionSelector',
          start: textPositionSelector?.start ?? 0,
          end: textPositionSelector?.end ?? 0,
        }
      );
      return querySelector(selectedAnchor, options)
        .then(maybeAssertQuote)
        .then((range) =>
          Promise.resolve({
            range,
            type: 'text-position',
          })
        );
    });
  }

  // Priority 3: TextQuoteSelector - Uses exact text matching with optional prefix/suffix
  // Note: This selector does NOT have quote assertion applied to it
  if (textQuoteSelector) {
    promise = promise.catch(() => {
      const selectedAnchor = TextQuoteAnchor.fromSelector(root as HTMLElement, {
        type: 'TextQuoteSelector',
        exact: textQuoteSelector?.exact ?? '',
        prefix: textQuoteSelector?.prefix,
        suffix: textQuoteSelector?.suffix,
      });
      return querySelector(selectedAnchor, options).then((range) =>
        Promise.resolve({
          range,
          type: 'text-quote',
        })
      );
    });
  }

  return promise;
}
