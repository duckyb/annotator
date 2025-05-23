import { TextQuoteAnchor } from '../../anchors/text-quote-anchor';
import type { TextQuoteSelectorWithType } from '../../types';
import { setupTestContainer, teardownTestContainer, createRangeForWord as createRangeForWordUtil } from './test-utils';

describe('TextQuoteAnchor', () => {
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
    it('should create a TextQuoteAnchor with the provided values', () => {
      const anchor = new TextQuoteAnchor(container, 'Liberty', {
        prefix: 'conceived in ',
        suffix: ', and dedicated'
      });
      
      expect(anchor).toBeInstanceOf(TextQuoteAnchor);
      expect(anchor.root).toBe(container);
      expect(anchor.exact).toBe('Liberty');
      expect(anchor.context.prefix).toBe('conceived in ');
      expect(anchor.context.suffix).toBe(', and dedicated');
    });

    it('should create a TextQuoteAnchor with default empty context', () => {
      const anchor = new TextQuoteAnchor(container, 'Liberty');
      
      expect(anchor).toBeInstanceOf(TextQuoteAnchor);
      expect(anchor.root).toBe(container);
      expect(anchor.exact).toBe('Liberty');
      expect(anchor.context.prefix).toBeUndefined();
      expect(anchor.context.suffix).toBeUndefined();
    });
  });

  describe('#fromRange', () => {
    it('should create a TextQuoteAnchor from a DOM Range', () => {
      const word = 'Liberty';
      const range = createRangeForWord(word);
      expect(range).not.toBeNull();
      
      if (range) {
        const anchor = TextQuoteAnchor.fromRange(container, range);
        
        expect(anchor).toBeInstanceOf(TextQuoteAnchor);
        expect(anchor.root).toBe(container);
        expect(anchor.exact).toBe(word);
        expect(anchor.context.prefix).toBeDefined();
        expect(anchor.context.suffix).toBeDefined();
      }
    });

    it('should throw an error if container element cannot be found', () => {
      // Create a range with a text node that has no parent
      const textNode = document.createTextNode('Test text');
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 4);
      
      expect(() => {
        TextQuoteAnchor.fromRange(container, range);
      }).toThrow();
    });
  });

  describe('#fromSelector', () => {
    it('should create a TextQuoteAnchor from a TextQuoteSelector', () => {
      const selector: TextQuoteSelectorWithType = {
        type: 'TextQuoteSelector',
        exact: 'Liberty',
        prefix: 'conceived in ',
        suffix: ', and dedicated'
      };
      
      const anchor = TextQuoteAnchor.fromSelector(container, selector);
      
      expect(anchor).toBeInstanceOf(TextQuoteAnchor);
      expect(anchor.root).toBe(container);
      expect(anchor.exact).toBe('Liberty');
      expect(anchor.context.prefix).toBe('conceived in ');
      expect(anchor.context.suffix).toBe(', and dedicated');
    });
  });

  describe('#toSelector', () => {
    it('should convert a TextQuoteAnchor to a TextQuoteSelector', () => {
      const anchor = new TextQuoteAnchor(container, 'Liberty', {
        prefix: 'conceived in ',
        suffix: ', and dedicated'
      });
      
      const selector = anchor.toSelector();
      
      expect(selector.type).toBe('TextQuoteSelector');
      expect(selector.exact).toBe('Liberty');
      expect(selector.prefix).toBe('conceived in ');
      expect(selector.suffix).toBe(', and dedicated');
    });
  });

  describe('#toRange', () => {
    it('should convert a TextQuoteAnchor to a DOM Range', () => {
      const word = 'Liberty';
      const anchor = new TextQuoteAnchor(container, word, {
        prefix: 'conceived in ',
        suffix: ', and dedicated'
      });
      
      const range = anchor.toRange();
      
      expect(range).toBeInstanceOf(Range);
      expect(range.toString()).toBe(word);
    });

    it('should throw an error if the quote is not found', () => {
      const anchor = new TextQuoteAnchor(container, 'NonExistentText');
      
      expect(() => {
        anchor.toRange();
      }).toThrow();
    });

    it('should throw an error if the quote with matching prefix is not found', () => {
      const anchor = new TextQuoteAnchor(container, 'Liberty', {
        prefix: 'wrong prefix ',
      });
      
      expect(() => {
        anchor.toRange();
      }).toThrow();
    });

    it('should throw an error if the quote with matching suffix is not found', () => {
      const anchor = new TextQuoteAnchor(container, 'Liberty', {
        suffix: ' wrong suffix',
      });
      
      expect(() => {
        anchor.toRange();
      }).toThrow();
    });
  });

  describe('#toPositionAnchor', () => {
    it('should convert a TextQuoteAnchor to a TextPositionAnchor', () => {
      const word = 'Liberty';
      const anchor = new TextQuoteAnchor(container, word);
      
      const positionAnchor = anchor.toPositionAnchor();
      
      expect(positionAnchor).toBeDefined();
      
      // Verify the position anchor by converting it to a range
      const range = positionAnchor.toRange();
      expect(range.toString()).toBe(word);
    });

    it('should throw an error if the quote is not found', () => {
      const anchor = new TextQuoteAnchor(container, 'NonExistentText');
      
      expect(() => {
        anchor.toPositionAnchor();
      }).toThrow();
    });
  });

  describe('round trip conversion', () => {
    it('should create a TextQuoteAnchor that can find the text', () => {
      // Create an anchor with exact context that we know exists
      const word = 'Liberty';
      const anchor = new TextQuoteAnchor(container, word, {
        prefix: 'conceived in ',
        suffix: ', and dedicated'
      });
      
      // Verify the anchor can find the text
      const range = anchor.toRange();
      expect(range.toString()).toBe(word);
    });
    
    it('should handle conversion from Range to TextQuoteAnchor', () => {
      // Use a single test word with a known context
      const word = 'Liberty';
      const originalRange = createRangeForWord(word);
      expect(originalRange).not.toBeNull();
      
      if (originalRange) {
        // Range to TextQuoteAnchor
        const anchor = TextQuoteAnchor.fromRange(container, originalRange);
        
        // Verify the anchor properties
        expect(anchor.exact).toBe(word);
        expect(anchor.context.prefix).toBeDefined();
        expect(anchor.context.suffix).toBeDefined();
      }
    });

    it('should handle round trip from TextQuoteAnchor to Selector and back', () => {
      const exact = 'Liberty';
      const prefix = 'conceived in ';
      const suffix = ', and dedicated';
      
      // Create original anchor
      const originalAnchor = new TextQuoteAnchor(container, exact, { prefix, suffix });
      
      // Convert to selector
      const selector = originalAnchor.toSelector();
      
      // Convert back to anchor
      const newAnchor = TextQuoteAnchor.fromSelector(container, selector);
      
      // Verify properties match
      expect(newAnchor.exact).toBe(exact);
      expect(newAnchor.context.prefix).toBe(prefix);
      expect(newAnchor.context.suffix).toBe(suffix);
      
      // Verify it can find the text
      const range = newAnchor.toRange();
      expect(range.toString()).toBe(exact);
    });
  });
});
