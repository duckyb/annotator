import { RangeAnchor } from './range-anchor';
import {
  setupTestContainer,
  teardownTestContainer,
  createRangeForWord,
} from '../__tests__/utils/anchor-utils';

describe('RangeAnchor', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = setupTestContainer();
  });

  afterEach(() => {
    teardownTestContainer(container);
  });

  // Helper function to create a range for the word "Liberty"
  function createLibertyRange(): Range | null {
    return createRangeForWord(container, 'Liberty');
  }

  describe('#fromRange', () => {
    it('should create a RangeAnchor from a DOM Range', () => {
      const range = createLibertyRange();
      expect(range).not.toBeNull();

      if (range) {
        // Create a RangeAnchor from the range
        const anchor = RangeAnchor.fromRange(container, range);

        // Verify the anchor was created correctly
        expect(anchor).toBeInstanceOf(RangeAnchor);
        expect(anchor.root).toBe(container);
        expect(anchor.range).toBeDefined();
      }
    });
  });

  describe('#toSelector', () => {
    it('should convert a RangeAnchor to a RangeSelector', () => {
      const range = createLibertyRange();
      expect(range).not.toBeNull();

      if (range) {
        // Create a RangeAnchor from the range
        const anchor = RangeAnchor.fromRange(container, range);

        // Convert to selector
        const selector = anchor.toSelector();

        // Verify the selector properties
        expect(selector.type).toBe('RangeSelector');
        expect(selector.startContainer).toBeDefined();
        expect(typeof selector.startOffset).toBe('number');
        expect(selector.endContainer).toBeDefined();
        expect(typeof selector.endOffset).toBe('number');
      }
    });
  });

  describe('#toRange', () => {
    it('should convert a RangeAnchor back to a DOM Range', () => {
      const range = createLibertyRange();
      expect(range).not.toBeNull();

      if (range) {
        // Create a RangeAnchor from the range
        const anchor = RangeAnchor.fromRange(container, range);

        // Convert back to a DOM Range
        const newRange = anchor.toRange();

        // Verify the range
        expect(newRange).toBeDefined();
        expect(newRange.toString()).toBe('Liberty');
      }
    });
  });

  describe('round trip conversion', () => {
    it('should be able to convert from Range to RangeAnchor to Selector and back', () => {
      const range = createLibertyRange();
      expect(range).not.toBeNull();

      if (range) {
        // Step 1: Range to RangeAnchor
        const anchor = RangeAnchor.fromRange(container, range);

        // Step 2: RangeAnchor to Selector
        const selector = anchor.toSelector();

        // Step 3: Selector back to RangeAnchor
        const newAnchor = RangeAnchor.fromSelector(container, selector);

        // Step 4: RangeAnchor back to Range
        const newRange = newAnchor.toRange();

        // Verify the final range matches the original text
        expect(newRange.toString()).toBe('Liberty');
      }
    });
  });

  describe('#fromSelector', () => {
    it('should create a RangeAnchor from a RangeSelector', () => {
      // First create a real range and get its selector to ensure we have a valid format
      const range = createLibertyRange();
      expect(range).not.toBeNull();

      if (range) {
        // Create a RangeAnchor from the range
        const originalAnchor = RangeAnchor.fromRange(container, range);

        // Get a valid selector from the anchor
        const selector = originalAnchor.toSelector();

        // Create a new anchor from the selector
        const newAnchor = RangeAnchor.fromSelector(container, selector);

        // Verify the anchor
        expect(newAnchor).toBeInstanceOf(RangeAnchor);
        expect(newAnchor.root).toBe(container);

        // Verify the range can be created and contains the expected text
        const newRange = newAnchor.toRange();
        expect(newRange.toString()).toBe('Liberty');
      }
    });
  });
});
