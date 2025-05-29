import { TextPositionAnchor } from './text-position-anchor';
import type { TextPositionSelectorWithType } from '../types';
import {
  setupTestContainer,
  teardownTestContainer,
  createRangeForWord as createRangeForWordUtil,
} from '../__tests__/utils/anchor-utils';

describe('TextPositionAnchor', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = setupTestContainer();
  });

  afterEach(() => {
    teardownTestContainer(container);
  });

  // Helper function to create a range for a specific word
  function createRangeForWord(word: string): Range | null {
    return createRangeForWordUtil(container, word);
  }

  describe('constructor', () => {
    it('should create a TextPositionAnchor with the provided values', () => {
      const anchor = new TextPositionAnchor(container, 10, 20);

      expect(anchor).toBeInstanceOf(TextPositionAnchor);
      expect(anchor.root).toBe(container);
      expect(anchor.start).toBe(10);
      expect(anchor.end).toBe(20);
    });
  });

  describe('#fromRange', () => {
    it('should create a TextPositionAnchor from a DOM Range', () => {
      const word = 'Liberty';
      const range = createRangeForWord(word);
      expect(range).not.toBeNull();

      if (range) {
        const anchor = TextPositionAnchor.fromRange(container, range);

        expect(anchor).toBeInstanceOf(TextPositionAnchor);
        expect(anchor.root).toBe(container);
        expect(typeof anchor.start).toBe('number');
        expect(typeof anchor.end).toBe('number');

        // Verify that the positions are correct by converting back to a range
        const newRange = anchor.toRange();
        expect(newRange.toString()).toBe(word);
      }
    });

    it('should throw an error if container element cannot be found', () => {
      // Create a range with a text node that has no parent
      const textNode = document.createTextNode('Test text');
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 4);

      expect(() => {
        TextPositionAnchor.fromRange(container, range);
      }).toThrow();
    });
  });

  describe('#fromSelector', () => {
    it('should create a TextPositionAnchor from a TextPositionSelector', () => {
      const selector: TextPositionSelectorWithType = {
        type: 'TextPositionSelector',
        start: 10,
        end: 20,
      };

      const anchor = TextPositionAnchor.fromSelector(container, selector);

      expect(anchor).toBeInstanceOf(TextPositionAnchor);
      expect(anchor.root).toBe(container);
      expect(anchor.start).toBe(10);
      expect(anchor.end).toBe(20);
    });
  });

  describe('#toSelector', () => {
    it('should convert a TextPositionAnchor to a TextPositionSelector', () => {
      const anchor = new TextPositionAnchor(container, 10, 20);
      const selector = anchor.toSelector();

      expect(selector.type).toBe('TextPositionSelector');
      expect(selector.start).toBe(10);
      expect(selector.end).toBe(20);
    });
  });

  describe('#toRange', () => {
    it('should convert a TextPositionAnchor to a DOM Range', () => {
      // First create a range for a known word
      const word = 'Liberty';
      const originalRange = createRangeForWord(word);
      expect(originalRange).not.toBeNull();

      if (originalRange) {
        // Convert to TextPositionAnchor
        const anchor = TextPositionAnchor.fromRange(container, originalRange);

        // Convert back to Range
        const newRange = anchor.toRange();

        // Verify the range
        expect(newRange).toBeInstanceOf(Range);
        expect(newRange.toString()).toBe(word);
      }
    });

    it('should throw an error if text nodes cannot be found', () => {
      // Create an anchor with positions that are out of bounds
      const anchor = new TextPositionAnchor(container, 1000, 1010);

      expect(() => {
        anchor.toRange();
      }).toThrow();
    });
  });

  describe('round trip conversion', () => {
    it('should handle round trip from Range to TextPositionAnchor to Range', () => {
      const testWords = ['Four', 'Liberty', 'equal'];

      testWords.forEach((word) => {
        const originalRange = createRangeForWord(word);
        expect(originalRange).not.toBeNull();

        if (originalRange) {
          // Range to TextPositionAnchor
          const anchor = TextPositionAnchor.fromRange(container, originalRange);

          // TextPositionAnchor to Range
          const newRange = anchor.toRange();

          // Verify the text content matches
          expect(newRange.toString()).toBe(word);
        }
      });
    });

    it('should handle round trip from TextPositionAnchor to Selector and back', () => {
      const start = 10;
      const end = 20;

      // Create original anchor
      const originalAnchor = new TextPositionAnchor(container, start, end);

      // Convert to selector
      const selector = originalAnchor.toSelector();

      // Convert back to anchor
      const newAnchor = TextPositionAnchor.fromSelector(container, selector);

      // Verify properties match
      expect(newAnchor.start).toBe(start);
      expect(newAnchor.end).toBe(end);
    });
  });
});
