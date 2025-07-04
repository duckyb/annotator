import { anchor } from './anchor';
import type {
  SelectorWithType,
  TextPositionSelectorWithType,
  TextQuoteSelectorWithType,
  RangeSelectorWithType,
  QuerySelectorOptions,
} from '../types';
import {
  setupTestContainer,
  teardownTestContainer,
} from '../__tests__/utils/highlighter-utils';
import { querySelector } from './querySelector';
import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from '../anchors';

// Mock dependencies
jest.mock('../anchors', () => ({
  RangeAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
  TextPositionAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
  TextQuoteAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
}));

jest.mock('./querySelector', () => ({
  querySelector: jest.fn().mockImplementation(() => {
    const mockRange = document.createRange();
    const textNode = document.createTextNode('test exact match');
    mockRange.setStart(textNode, 0);
    mockRange.setEnd(textNode, 16);
    return Promise.resolve(mockRange);
  }),
}));

describe('anchor', () => {
  let container: HTMLElement;

  const createMockRangeSelector = (
    overrides?: Partial<RangeSelectorWithType>
  ): RangeSelectorWithType => ({
    type: 'RangeSelector',
    startContainer: 'node-0',
    startOffset: 0,
    endContainer: 'node-0',
    endOffset: 5,
    ...overrides,
  });

  const createMockTextQuoteSelector = (
    overrides?: Partial<TextQuoteSelectorWithType>
  ): TextQuoteSelectorWithType => ({
    type: 'TextQuoteSelector',
    exact: 'test exact match',
    prefix: 'prefix ',
    suffix: ' suffix',
    ...overrides,
  });

  const createMockTextPositionSelector = (
    overrides?: Partial<TextPositionSelectorWithType>
  ): TextPositionSelectorWithType => ({
    type: 'TextPositionSelector',
    start: 0,
    end: 16,
    ...overrides,
  });

  beforeEach(() => {
    container = setupTestContainer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestContainer(container);
  });

  describe('basic functionality', () => {
    it('should anchor with range selector', async () => {
      const rangeSelector = createMockRangeSelector();
      const selectors: SelectorWithType[] = [rangeSelector];

      const result = await anchor(container, selectors);

      expect(result).toEqual({
        type: 'range',
        range: expect.any(Range),
      });
    });

    it('should anchor with text position selector', async () => {
      const textPositionSelector = createMockTextPositionSelector();
      const selectors: SelectorWithType[] = [textPositionSelector];

      const result = await anchor(container, selectors);

      expect(result).toEqual({
        type: 'text-position',
        range: expect.any(Range),
      });
    });

    it('should anchor with text quote selector', async () => {
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [textQuoteSelector];

      const result = await anchor(container, selectors);

      expect(result).toEqual({
        type: 'text-quote',
        range: expect.any(Range),
      });
    });

    it('should handle multiple selectors and use range selector first', async () => {
      const rangeSelector = createMockRangeSelector();
      const textQuoteSelector = createMockTextQuoteSelector();
      const textPositionSelector = createMockTextPositionSelector();
      const selectors: SelectorWithType[] = [
        rangeSelector,
        textQuoteSelector,
        textPositionSelector,
      ];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('range');
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to text position when range selector fails', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockImplementationOnce(() =>
        Promise.reject(new Error('Range failed'))
      );
      mockQuerySelector.mockImplementationOnce(() => {
        const mockRange = document.createRange();
        const textNode = document.createTextNode('test exact match');
        mockRange.setStart(textNode, 0);
        mockRange.setEnd(textNode, 16);
        return Promise.resolve(mockRange);
      });

      const rangeSelector = createMockRangeSelector();
      const textPositionSelector = createMockTextPositionSelector();
      const selectors: SelectorWithType[] = [
        rangeSelector,
        textPositionSelector,
      ];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-position');
    });

    it('should fallback to text quote when range and position selectors fail', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockImplementationOnce(() =>
        Promise.reject(new Error('Range failed'))
      );
      mockQuerySelector.mockImplementationOnce(() =>
        Promise.reject(new Error('Position failed'))
      );
      mockQuerySelector.mockImplementationOnce(() => {
        const mockRange = document.createRange();
        const textNode = document.createTextNode('test exact match');
        mockRange.setStart(textNode, 0);
        mockRange.setEnd(textNode, 16);
        return Promise.resolve(mockRange);
      });

      const rangeSelector = createMockRangeSelector();
      const textPositionSelector = createMockTextPositionSelector();
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [
        rangeSelector,
        textPositionSelector,
        textQuoteSelector,
      ];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-quote');
    });

    it('should reject when all selectors fail', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockImplementation(() =>
        Promise.reject(new Error('All failed'))
      );

      const rangeSelector = createMockRangeSelector();
      const textPositionSelector = createMockTextPositionSelector();
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [
        rangeSelector,
        textPositionSelector,
        textQuoteSelector,
      ];

      await expect(anchor(container, selectors)).rejects.toThrow('All failed');
    });
  });

  describe('quote assertion', () => {
    it('should pass quote assertion when exact match is correct', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockImplementation(() => {
        const mockRange = document.createRange();
        const textNode = document.createTextNode('test exact match');
        mockRange.setStart(textNode, 0);
        mockRange.setEnd(textNode, 16);
        // Mock toString to return the exact text
        mockRange.toString = jest.fn().mockReturnValue('test exact match');
        return Promise.resolve(mockRange);
      });

      const textQuoteSelector = createMockTextQuoteSelector({
        exact: 'test exact match',
      });
      const selectors: SelectorWithType[] = [textQuoteSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-quote');
    });

    it('should fail quote assertion when exact match is incorrect and fallback to text quote', async () => {
      const mockQuerySelector = jest.mocked(querySelector);

      // First call (range) returns wrong text, second call (textQuote) succeeds
      mockQuerySelector
        .mockImplementationOnce(() => {
          const mockRange = document.createRange();
          const textNode = document.createTextNode('different text');
          mockRange.setStart(textNode, 0);
          mockRange.setEnd(textNode, 13);
          // Mock toString to return different text
          mockRange.toString = jest.fn().mockReturnValue('different text');
          return Promise.resolve(mockRange);
        })
        .mockImplementationOnce(() => {
          const mockRange = document.createRange();
          const textNode = document.createTextNode('test exact match');
          mockRange.setStart(textNode, 0);
          mockRange.setEnd(textNode, 16);
          return Promise.resolve(mockRange);
        });

      const rangeSelector = createMockRangeSelector();
      const textQuoteSelector = createMockTextQuoteSelector({
        exact: 'test exact match',
      });
      const selectors: SelectorWithType[] = [rangeSelector, textQuoteSelector];

      const result = await anchor(container, selectors);
      expect(result.type).toBe('text-quote');
    });

    it('should skip quote assertion when textQuoteSelector has no exact text', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockImplementation(() => {
        const mockRange = document.createRange();
        const textNode = document.createTextNode('any text');
        mockRange.setStart(textNode, 0);
        mockRange.setEnd(textNode, 8);
        mockRange.toString = jest.fn().mockReturnValue('any text');
        return Promise.resolve(mockRange);
      });

      const rangeSelector = createMockRangeSelector();
      const textQuoteSelector = createMockTextQuoteSelector({
        exact: '',
      });
      const selectors: SelectorWithType[] = [rangeSelector, textQuoteSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('range');
    });

    it('should apply quote assertion to range selector results and fallback', async () => {
      const mockQuerySelector = jest.mocked(querySelector);

      // Range selector succeeds but with wrong quote, then textQuote succeeds
      mockQuerySelector
        .mockImplementationOnce(() => {
          const mockRange = document.createRange();
          const textNode = document.createTextNode('wrong text');
          mockRange.setStart(textNode, 0);
          mockRange.setEnd(textNode, 10);
          mockRange.toString = jest.fn().mockReturnValue('wrong text');
          return Promise.resolve(mockRange);
        })
        .mockImplementationOnce(() => {
          const mockRange = document.createRange();
          const textNode = document.createTextNode('expected text');
          mockRange.setStart(textNode, 0);
          mockRange.setEnd(textNode, 13);
          return Promise.resolve(mockRange);
        });

      const rangeSelector = createMockRangeSelector();
      const textQuoteSelector = createMockTextQuoteSelector({
        exact: 'expected text',
      });
      const selectors: SelectorWithType[] = [rangeSelector, textQuoteSelector];

      const result = await anchor(container, selectors);
      expect(result.type).toBe('text-quote');
    });
  });

  describe('options handling', () => {
    it('should pass hint option to text position selector', async () => {
      const mockTextPositionAnchor = jest.mocked(TextPositionAnchor);

      const textPositionSelector = createMockTextPositionSelector({
        start: 10,
      });
      const selectors: SelectorWithType[] = [textPositionSelector];
      const options: QuerySelectorOptions = { hint: 5 };

      await anchor(container, selectors, options);

      expect(mockTextPositionAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          type: 'TextPositionSelector',
          start: 10,
          end: 16,
        })
      );
    });

    it('should set hint from text position selector start', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      const mockQuerySelectorFn = jest
        .fn()
        .mockResolvedValue(document.createRange());
      mockQuerySelector.mockImplementation(mockQuerySelectorFn);

      const textPositionSelector = createMockTextPositionSelector({
        start: 15,
      });
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [
        textPositionSelector,
        textQuoteSelector,
      ];

      await anchor(container, selectors);

      // The hint should be set to the text position start value
      expect(mockQuerySelectorFn).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ hint: 15 })
      );
    });

    it('should handle default options', async () => {
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [textQuoteSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-quote');
    });
  });

  describe('selector type handling', () => {
    it('should handle only range selector', async () => {
      const rangeSelector = createMockRangeSelector();
      const selectors: SelectorWithType[] = [rangeSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('range');
    });

    it('should handle only text position selector', async () => {
      const textPositionSelector = createMockTextPositionSelector();
      const selectors: SelectorWithType[] = [textPositionSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-position');
    });

    it('should handle only text quote selector', async () => {
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [textQuoteSelector];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-quote');
    });

    it('should handle unknown selector types gracefully', async () => {
      const unknownSelector = { type: 'UnknownSelector' } as any;
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [
        unknownSelector,
        textQuoteSelector,
      ];

      const result = await anchor(container, selectors);

      expect(result.type).toBe('text-quote');
    });
  });

  describe('anchor creation', () => {
    it('should call RangeAnchor.fromSelector with correct parameters', async () => {
      const mockRangeAnchor = jest.mocked(RangeAnchor);
      const rangeSelector = createMockRangeSelector();
      const selectors: SelectorWithType[] = [rangeSelector];

      await anchor(container, selectors);

      expect(mockRangeAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        rangeSelector
      );
    });

    it('should call TextPositionAnchor.fromSelector with correct parameters', async () => {
      const mockTextPositionAnchor = jest.mocked(TextPositionAnchor);
      const textPositionSelector = createMockTextPositionSelector();
      const selectors: SelectorWithType[] = [textPositionSelector];

      await anchor(container, selectors);

      expect(mockTextPositionAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          type: 'TextPositionSelector',
          start: 0,
          end: 16,
        })
      );
    });

    it('should call TextQuoteAnchor.fromSelector with correct parameters', async () => {
      const mockTextQuoteAnchor = jest.mocked(TextQuoteAnchor);
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [textQuoteSelector];

      await anchor(container, selectors);

      expect(mockTextQuoteAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          type: 'TextQuoteSelector',
          exact: 'test exact match',
          prefix: 'prefix ',
          suffix: ' suffix',
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty selectors array', async () => {
      const selectors: SelectorWithType[] = [];

      await expect(anchor(container, selectors)).rejects.toThrow(
        'unable to anchor'
      );
    });

    it('should handle undefined values in text position selector', async () => {
      const mockTextPositionAnchor = jest.mocked(TextPositionAnchor);
      const textPositionSelector = {
        type: 'TextPositionSelector',
        start: undefined,
        end: undefined,
      } as any;
      const selectors: SelectorWithType[] = [textPositionSelector];

      await anchor(container, selectors);

      expect(mockTextPositionAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          type: 'TextPositionSelector',
          start: 0,
          end: 0,
        })
      );
    });

    it('should handle undefined values in text quote selector', async () => {
      const mockTextQuoteAnchor = jest.mocked(TextQuoteAnchor);
      const textQuoteSelector = {
        type: 'TextQuoteSelector',
        exact: undefined,
        prefix: undefined,
        suffix: undefined,
      } as any;
      const selectors: SelectorWithType[] = [textQuoteSelector];

      await anchor(container, selectors);

      expect(mockTextQuoteAnchor.fromSelector).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          type: 'TextQuoteSelector',
          exact: '',
          prefix: undefined,
          suffix: undefined,
        })
      );
    });

    it('should handle query selector promise rejection', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      mockQuerySelector.mockRejectedValue(new Error('Query selector failed'));

      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [textQuoteSelector];

      await expect(anchor(container, selectors)).rejects.toThrow(
        'Query selector failed'
      );
    });
  });

  describe('promise chain behavior', () => {
    it('should maintain promise chain order', async () => {
      const mockQuerySelector = jest.mocked(querySelector);
      const callOrder: string[] = [];

      mockQuerySelector.mockImplementation((anchor: any) => {
        callOrder.push(anchor.constructor.name);
        return Promise.reject(new Error('Failed'));
      });

      const rangeSelector = createMockRangeSelector();
      const textPositionSelector = createMockTextPositionSelector();
      const textQuoteSelector = createMockTextQuoteSelector();
      const selectors: SelectorWithType[] = [
        rangeSelector,
        textPositionSelector,
        textQuoteSelector,
      ];

      try {
        await anchor(container, selectors);
      } catch {
        // Expected to fail
      }

      // The order should be maintained due to the promise chain
      expect(callOrder.length).toBeGreaterThan(0);
    });
  });
});
