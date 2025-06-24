import { Annotator } from './annotator';
import type { Annotation } from './types';
import {
  setupTestContainer,
  teardownTestContainer,
  createRangeForText,
  createMockPdfEnvironment,
} from './__tests__/utils/highlighter-utils';

// Mock dependencies
jest.mock('./highlighter/highlightRangeWrapper', () => ({
  highlightRangeWrapper: jest.fn().mockImplementation(() => {
    const mockHighlight = document.createElement('span');
    mockHighlight.className = 'highlight';
    mockHighlight.textContent = 'mocked highlight';
    return [mockHighlight];
  }),
}));

jest.mock('./highlighter/removeHighlights', () => ({
  removeHighlights: jest.fn(),
}));

jest.mock('./anchors/range-anchor', () => ({
  RangeAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
}));

jest.mock('./anchors/text-quote-anchor', () => ({
  TextQuoteAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
}));

jest.mock('./anchors/text-position-anchor', () => ({
  TextPositionAnchor: {
    fromSelector: jest.fn().mockImplementation(() => ({
      toRange: jest.fn().mockReturnValue(document.createRange()),
    })),
  },
}));

jest.mock('./anchors/annotation-builder', () => ({
  AnnotationBuilder: jest.fn().mockImplementation(() => ({
    createAnnotation: jest.fn().mockReturnValue({
      id: 'test-annotation-id',
      context: { document: 'test-doc' },
      rangeSelector: {
        startContainer: 0,
        startOffset: 0,
        endContainer: 0,
        endOffset: 5,
      },
      textQuoteSelector: { exact: 'test text', prefix: '', suffix: '' },
      textPositionSelector: { start: 0, end: 5 },
    }),
  })),
}));

jest.mock('./highlighter/highlight-manager', () => ({
  HighlightManager: jest.fn().mockImplementation(() => ({
    events$: {
      subscribe: jest.fn(),
    },
    attachEvents: jest.fn(),
    detachEvents: jest.fn(),
  })),
}));

describe('Annotator', () => {
  let container: HTMLDivElement;
  let annotator: Annotator;

  const createMockAnnotation = (
    overrides?: Partial<Annotation>
  ): Annotation => ({
    id: 'test-annotation-1',
    context: { document: 'test-doc' },
    serializedBy: 'test',
    rangeSelector: {
      type: 'RangeSelector',
      startContainer: 'node-0',
      startOffset: 0,
      endContainer: 'node-0',
      endOffset: 5,
    },
    textQuoteSelector: {
      type: 'TextQuoteSelector',
      exact: 'test text',
      prefix: '',
      suffix: '',
    },
    textPositionSelector: {
      type: 'TextPositionSelector',
      start: 0,
      end: 5,
    },
    color: '#FFFF00',
    ...overrides,
  });

  beforeEach(() => {
    container = setupTestContainer();
    annotator = new Annotator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestContainer(container);
    annotator.clear();
  });

  describe('constructor and configuration', () => {
    it('should create annotator with default options', () => {
      const newAnnotator = new Annotator();
      const options = newAnnotator.getOptions();

      expect(options.allowWhitespace).toBe(false);
    });

    it('should create annotator with custom options', () => {
      const newAnnotator = new Annotator({ allowWhitespace: true });
      const options = newAnnotator.getOptions();

      expect(options.allowWhitespace).toBe(true);
    });

    it('should configure options after creation', () => {
      annotator.configure({ allowWhitespace: true });
      const options = annotator.getOptions();

      expect(options.allowWhitespace).toBe(true);
    });

    it('should return event emitter instance', () => {
      const events = annotator.getEvents();

      expect(events).toBeDefined();
      expect(typeof events.emit).toBe('function');
      expect(typeof events.on).toBe('function');
    });
  });

  describe('context management', () => {
    it('should set and get document context', () => {
      const context = { document: 'test-doc', page: 1 };

      annotator.setContext(context);

      expect(annotator.getContext()).toEqual(context);
    });

    it('should clear document context', () => {
      const context = { document: 'test-doc' };
      annotator.setContext(context);

      annotator.clearContext();

      expect(annotator.getContext()).toBeNull();
    });

    it('should return null when no context is set', () => {
      expect(annotator.getContext()).toBeNull();
    });
  });

  describe('annotation loading and adding', () => {
    beforeEach(() => {
      annotator.setContext({ document: 'test-doc' });
    });

    it('should load multiple annotations', async () => {
      const annotations = [
        createMockAnnotation({ id: 'annotation-1' }),
        createMockAnnotation({ id: 'annotation-2' }),
      ];

      await annotator.load(annotations, container);

      expect(annotator.hasHighlights('annotation-1')).toBe(true);
      expect(annotator.hasHighlights('annotation-2')).toBe(true);
    });

    it('should add single annotation', async () => {
      const annotation = createMockAnnotation();

      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(true);
    });

    it('should not add annotation without context', async () => {
      annotator.clearContext();
      const annotation = createMockAnnotation();

      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });

    it('should not add annotation with mismatched context', async () => {
      annotator.setContext({ document: 'different-doc' });
      const annotation = createMockAnnotation();

      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });

    it('should reattach existing highlights', async () => {
      const annotation = createMockAnnotation();

      // Add annotation first
      await annotator.add(annotation, container);
      expect(annotator.hasHighlights(annotation.id)).toBe(true);

      // Reattach should work
      annotator.reattachHighlight(annotation, container);
      expect(annotator.hasHighlights(annotation.id)).toBe(true);
    });
  });

  describe('annotation removal', () => {
    beforeEach(() => {
      annotator.setContext({ document: 'test-doc' });
    });

    it('should remove annotation by ID', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      annotator.remove(annotation.id);

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });

    it('should remove all annotations', async () => {
      const annotations = [
        createMockAnnotation({ id: 'annotation-1' }),
        createMockAnnotation({ id: 'annotation-2' }),
      ];
      await annotator.load(annotations, container);

      annotator.removeAll();

      expect(annotator.hasHighlights('annotation-1')).toBe(false);
      expect(annotator.hasHighlights('annotation-2')).toBe(false);
    });

    it('should clear all highlights', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      annotator.clear();

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });
  });

  describe('highlight management', () => {
    beforeEach(() => {
      annotator.setContext({ document: 'test-doc' });
    });

    it('should get highlights by annotation ID', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      const highlights = annotator.getHighlightById(annotation.id);

      expect(highlights).toBeDefined();
      expect(highlights?.length).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent annotation', () => {
      const highlights = annotator.getHighlightById('non-existent');

      expect(highlights).toBeUndefined();
    });

    it('should add hover class to highlights', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      annotator.addHoverClass(annotation.id);

      const highlights = annotator.getHighlights(annotation.id);
      expect(highlights?.[0].classList.contains('is-hovered')).toBe(true);
    });

    it('should remove hover class from highlights', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      annotator.addHoverClass(annotation.id);
      annotator.removeHoverClass(annotation.id);

      const highlights = annotator.getHighlights(annotation.id);
      expect(highlights?.[0].classList.contains('is-hovered')).toBe(false);
    });
  });

  describe('orphan management', () => {
    it('should handle orphaned annotations when highlighting fails', async () => {
      // Set context first so annotation passes shouldProcessAnnotation
      annotator.setContext({ document: 'test-doc' });

      // Mock addHighlights to throw error (simulating highlighting failure)
      jest.spyOn(annotator, 'addHighlights').mockImplementation(() => {
        throw new Error('Highlighting failed');
      });

      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(false);

      // Restore addHighlights and check orphans
      jest.restoreAllMocks();
      annotator.checkOrphans();

      expect(annotator.hasHighlights(annotation.id)).toBe(true);
    });

    it('should handle orphans with context filtering', async () => {
      // Set initial context
      annotator.setContext({ document: 'test-doc' });

      const annotation1 = createMockAnnotation({
        id: 'orphan-1',
        context: { document: 'test-doc' },
      });
      const annotation2 = createMockAnnotation({
        id: 'orphan-2',
        context: { document: 'other-doc' },
      });

      // Mock addHighlights to fail for both
      jest.spyOn(annotator, 'addHighlights').mockImplementation(() => {
        throw new Error('Highlighting failed');
      });

      await annotator.add(annotation1, container);
      await annotator.add(annotation2, container);

      expect(annotator.hasHighlights('orphan-1')).toBe(false);
      expect(annotator.hasHighlights('orphan-2')).toBe(false);

      // Restore addHighlights and check orphans with different context
      jest.restoreAllMocks();
      annotator.setContext({ document: 'test-doc' });
      annotator.checkOrphans();

      // Only annotation1 should be processed as it matches current context
      expect(annotator.hasHighlights('orphan-1')).toBe(true);
      expect(annotator.hasHighlights('orphan-2')).toBe(false);
    });
  });

  describe('range and annotation conversion', () => {
    beforeEach(() => {
      annotator.setContext({ document: 'test-doc' });
    });

    it('should create annotation from range', () => {
      const text = 'bold text';
      const range = createRangeForText(container, text);
      expect(range).not.toBeNull();

      if (range) {
        const result = annotator.createAnnotation({
          root: container,
          range,
          context: { document: 'test-doc' },
          color: '#FF0000',
          metadata: { custom: 'data' },
        });

        expect(result.id).toBeDefined();
        expect(result.color).toBe('#FF0000');
        expect(result.context).toEqual({ document: 'test-doc' });
        expect(result.highlights).toBeDefined();
      }
    });

    it('should convert annotation to range', () => {
      const annotation = createMockAnnotation();

      const range = annotator.annotationToRange(container, annotation);

      expect(range).toBeInstanceOf(Range);
    });

    it('should throw error when converting annotation without context', () => {
      annotator.clearContext();
      const annotation = createMockAnnotation();

      expect(() => {
        annotator.annotationToRange(container, annotation);
      }).toThrow('Annotation does not belong to the current document context');
    });

    it('should throw error when no valid selector found', () => {
      const annotation = createMockAnnotation({
        rangeSelector: undefined,
        textQuoteSelector: undefined,
        textPositionSelector: undefined,
      });

      expect(() => {
        annotator.annotationToRange(container, annotation);
      }).toThrow('No valid selector found in annotation');
    });

    it('should fallback to text quote selector when range selector fails', () => {
      const annotation = createMockAnnotation({
        rangeSelector: undefined, // No range selector
        textQuoteSelector: {
          type: 'TextQuoteSelector',
          exact: 'fallback text',
          prefix: '',
          suffix: '',
        },
      });

      const range = annotator.annotationToRange(container, annotation);
      expect(range).toBeInstanceOf(Range);
    });

    it('should fallback to text position selector when range and quote fail', () => {
      const annotation = createMockAnnotation({
        rangeSelector: undefined,
        textQuoteSelector: undefined, // No text quote selector
        textPositionSelector: {
          type: 'TextPositionSelector',
          start: 0,
          end: 10,
        },
      });

      const range = annotator.annotationToRange(container, annotation);
      expect(range).toBeInstanceOf(Range);
    });
  });

  describe('context filtering', () => {
    it('should filter annotations by string context', () => {
      annotator.setContext('test-doc');
      const annotations = [
        createMockAnnotation({
          id: 'match-1',
          context: { document: 'test-doc' },
        }),
        createMockAnnotation({
          id: 'no-match',
          context: { document: 'other-doc' },
        }),
        createMockAnnotation({ id: 'match-2', context: { type: 'test-doc' } }),
      ];

      const filtered = annotator.filterAnnotationsByContext(annotations);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((a) => a.id)).toEqual(['match-1', 'match-2']);
    });

    it('should filter annotations by object context', () => {
      annotator.setContext({ document: 'test-doc', page: 1 });
      const annotations = [
        createMockAnnotation({
          id: 'match',
          context: { document: 'test-doc', page: 1, extra: 'data' },
        }),
        createMockAnnotation({
          id: 'no-match-doc',
          context: { document: 'other-doc', page: 1 },
        }),
        createMockAnnotation({
          id: 'no-match-page',
          context: { document: 'test-doc', page: 2 },
        }),
      ];

      const filtered = annotator.filterAnnotationsByContext(annotations);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('match');
    });

    it('should return all annotations when no context is set', () => {
      const annotations = [
        createMockAnnotation({ id: 'annotation-1' }),
        createMockAnnotation({ id: 'annotation-2' }),
      ];

      const filtered = annotator.filterAnnotationsByContext(annotations);

      expect(filtered).toEqual(annotations);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      annotator.setContext({ document: 'test-doc' });
    });

    it('should handle adding annotation that fails to highlight', async () => {
      // Mock highlightRangeWrapper to return empty array
      const mockHighlightRangeWrapper = jest.mocked(
        await import('./highlighter/highlightRangeWrapper')
      ).highlightRangeWrapper;
      mockHighlightRangeWrapper.mockReturnValueOnce([]);

      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });

    it('should handle removing non-existent annotation', () => {
      expect(() => {
        annotator.remove('non-existent-id');
      }).not.toThrow();
    });

    it('should handle hover operations on non-existent annotation', () => {
      expect(() => {
        annotator.addHoverClass('non-existent-id');
        annotator.removeHoverClass('non-existent-id');
      }).not.toThrow();
    });

    it('should refresh highlights (clear and reapply)', async () => {
      const annotation = createMockAnnotation();
      await annotator.add(annotation, container);

      expect(annotator.hasHighlights(annotation.id)).toBe(true);

      annotator.refresh();

      expect(annotator.hasHighlights(annotation.id)).toBe(false);
    });

    it('should handle annotation with no color (default to yellow)', () => {
      const text = 'italic text';
      const range = createRangeForText(container, text);
      expect(range).not.toBeNull();

      if (range) {
        const result = annotator.createAnnotation({
          root: container,
          range,
          context: { document: 'test-doc' },
        });

        expect(result.color).toBe('#FFFF00'); // Default yellow
      }
    });

    it('should return existing highlights when adding duplicate annotation', async () => {
      const annotation = createMockAnnotation();

      // Add annotation first time
      await annotator.add(annotation, container);
      const firstHighlights = annotator.getHighlights(annotation.id);

      // Add same annotation again
      await annotator.add(annotation, container);
      const secondHighlights = annotator.getHighlights(annotation.id);

      expect(firstHighlights).toEqual(secondHighlights);
      expect(annotator.hasHighlights(annotation.id)).toBe(true);
    });

    it('should handle error in annotationToRange during addHighlights', async () => {
      const annotation = createMockAnnotation();

      // Mock annotationToRange to throw error
      jest.spyOn(annotator, 'annotationToRange').mockImplementation(() => {
        throw new Error('Mock error');
      });

      const highlights = annotator.addHighlights(container, annotation);

      expect(highlights).toEqual([]);

      // Restore original method
      jest.restoreAllMocks();
    });

    it('should handle null range in addHighlights', async () => {
      const annotation = createMockAnnotation();

      // Mock annotationToRange to return null
      jest.spyOn(annotator, 'annotationToRange').mockImplementation(() => {
        return null as any;
      });

      const highlights = annotator.addHighlights(container, annotation);

      expect(highlights).toEqual([]);

      // Restore original method
      jest.restoreAllMocks();
    });

    it('should handle empty highlights array from highlightRangeWrapper', async () => {
      const annotation = createMockAnnotation();

      // Mock highlightRangeWrapper to return empty array
      const mockHighlightRangeWrapper = jest.mocked(
        await import('./highlighter/highlightRangeWrapper')
      ).highlightRangeWrapper;
      mockHighlightRangeWrapper.mockReturnValueOnce([]);

      const highlights = annotator.addHighlights(container, annotation);

      expect(highlights).toEqual([]);
    });
  });

  describe('PDF environment support', () => {
    let pdfEnv: {
      canvas: HTMLCanvasElement;
      textLayer: HTMLDivElement;
      container: HTMLDivElement;
      cleanup: () => void;
    };

    beforeEach(() => {
      pdfEnv = createMockPdfEnvironment();
      annotator.setContext({ document: 'test-pdf' });
    });

    afterEach(() => {
      pdfEnv.cleanup();
    });

    it('should work in PDF environment', async () => {
      const annotation = createMockAnnotation({
        context: { document: 'test-pdf' },
      });
      await annotator.add(annotation, pdfEnv.container);

      expect(annotator.hasHighlights(annotation.id)).toBe(true);
    });
  });
});
