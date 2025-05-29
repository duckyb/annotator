import { Annotator } from '../../annotator';
import { Annotation } from '../../types';

describe('Annotation Context Filtering Integration', () => {
  let annotator: Annotator;
  let rootElement: HTMLElement;

  // Sample text for our test document
  const sampleText = `
    <p id="paragraph-1">This is the first paragraph with some text that can be annotated.</p>
    <p id="paragraph-2">This is the second paragraph with different content.</p>
    <p id="paragraph-3">This is the third paragraph that contains more annotatable content.</p>
  `;

  // Mock annotations with different contexts
  const mockAnnotations: Annotation[] = [
    {
      id: 'annotation-1',
      textQuoteSelector: {
        type: 'TextQuoteSelector',
        exact: 'first paragraph',
        prefix: 'This is the ',
        suffix: ' with some text',
      },
      textPositionSelector: {
        type: 'TextPositionSelector',
        start: 17,
        end: 31,
      },
      context: {
        documentId: 'test-document',
      },
      serializedBy: 'test-integration',
      color: '#FF5733', // Coral
    },
    {
      id: 'annotation-2',
      textQuoteSelector: {
        type: 'TextQuoteSelector',
        exact: 'second paragraph',
        prefix: 'This is the ',
        suffix: ' with different',
      },
      textPositionSelector: {
        type: 'TextPositionSelector',
        start: 79,
        end: 94,
      },
      context: {
        documentId: 'test-document',
      },
      serializedBy: 'test-integration',
      color: '#33FF57', // Light green
    },
    {
      id: 'annotation-3',
      textQuoteSelector: {
        type: 'TextQuoteSelector',
        exact: 'third paragraph',
        prefix: 'This is the ',
        suffix: ' that contains',
      },
      textPositionSelector: {
        type: 'TextPositionSelector',
        start: 142,
        end: 156,
      },
      context: {
        documentId: 'different-document', // Mismatched context
      },
      serializedBy: 'test-integration',
      color: '#3357FF', // Blue
    },
  ];

  beforeEach(() => {
    // Set up the test environment
    document.body.innerHTML = sampleText;
    rootElement = document.body;

    // Create a new Annotator instance for each test
    annotator = new Annotator();
  });

  afterEach(() => {
    // Clean up after each test
    annotator.removeAll();
    document.body.innerHTML = '';
  });

  it('should load annotations with matching context and ignore those with mismatched context', async () => {
    // Set the document context
    annotator.setContext({ documentId: 'test-document' });

    // Load all annotations
    await annotator.load(mockAnnotations, rootElement);

    // Check that annotations with matching context were loaded
    expect(annotator.hasHighlights('annotation-1')).toBe(true);
    expect(annotator.hasHighlights('annotation-2')).toBe(true);

    // Check that the annotation with mismatched context was not loaded
    expect(annotator.hasHighlights('annotation-3')).toBe(false);

    // Verify highlights exist in the DOM for matching annotations
    const highlights1 = annotator.getHighlightById('annotation-1');
    const highlights2 = annotator.getHighlightById('annotation-2');

    expect(highlights1).toBeDefined();
    expect(highlights1?.length).toBeGreaterThan(0);
    expect(highlights2).toBeDefined();
    expect(highlights2?.length).toBeGreaterThan(0);

    // Check that highlights have the correct color - the library applies some opacity
    if (highlights1 && highlights1.length > 0) {
      // Check that the color contains the expected RGB values (255, 87, 51)
      expect(highlights1[0].style.backgroundColor).toMatch(
        /rgba?\(\s*255\s*,\s*87\s*,\s*51/
      );
    }

    if (highlights2 && highlights2.length > 0) {
      // Check that the color contains the expected RGB values (51, 255, 87)
      expect(highlights2[0].style.backgroundColor).toMatch(
        /rgba?\(\s*51\s*,\s*255\s*,\s*87/
      );
    }
  });

  it('should not load any annotations when no context is set', async () => {
    // Don't set a context (or clear it)
    annotator.clearContext();

    // Load all annotations
    await annotator.load(mockAnnotations, rootElement);

    // No annotations should be loaded when context is null
    // This is the expected behavior based on the shouldProcessAnnotation method
    expect(annotator.hasHighlights('annotation-1')).toBe(false);
    expect(annotator.hasHighlights('annotation-2')).toBe(false);
    expect(annotator.hasHighlights('annotation-3')).toBe(false);
  });

  it('should filter annotations when context is a string', async () => {
    // Set a string context
    annotator.setContext('test-document');

    // Load all annotations
    await annotator.load(mockAnnotations, rootElement);

    // Check that annotations with matching context were loaded
    expect(annotator.hasHighlights('annotation-1')).toBe(true);
    expect(annotator.hasHighlights('annotation-2')).toBe(true);

    // Check that the annotation with mismatched context was not loaded
    expect(annotator.hasHighlights('annotation-3')).toBe(false);
  });

  it('should update highlights when context changes', async () => {
    // Start with test-document context
    annotator.setContext({ documentId: 'test-document' });
    await annotator.load(mockAnnotations, rootElement);

    // Verify initial state
    expect(annotator.hasHighlights('annotation-1')).toBe(true);
    expect(annotator.hasHighlights('annotation-2')).toBe(true);
    expect(annotator.hasHighlights('annotation-3')).toBe(false);

    // Clear all highlights
    annotator.removeAll();

    // Change context to different-document
    annotator.setContext({ documentId: 'different-document' });
    await annotator.load(mockAnnotations, rootElement);

    // Verify that now only annotation-3 is loaded
    expect(annotator.hasHighlights('annotation-1')).toBe(false);
    expect(annotator.hasHighlights('annotation-2')).toBe(false);
    expect(annotator.hasHighlights('annotation-3')).toBe(true);
  });

  it('should handle complex context objects correctly', async () => {
    // Create annotations with complex context
    const complexContextAnnotations: Annotation[] = [
      {
        id: 'complex-1',
        textQuoteSelector: {
          type: 'TextQuoteSelector',
          exact: 'first paragraph',
          prefix: 'This is the ',
          suffix: ' with some text',
        },
        context: {
          documentId: 'test-document',
          userId: '123',
          projectId: 'project-abc',
        },
        serializedBy: 'test-integration',
        color: '#FF5733',
      },
      {
        id: 'complex-2',
        textQuoteSelector: {
          type: 'TextQuoteSelector',
          exact: 'second paragraph',
          prefix: 'This is the ',
          suffix: ' with different',
        },
        context: {
          documentId: 'test-document',
          userId: '456',
          projectId: 'project-abc',
        },
        serializedBy: 'test-integration',
        color: '#33FF57',
      },
    ];

    // Set a partial context that should match both annotations
    annotator.setContext({
      documentId: 'test-document',
      projectId: 'project-abc',
    });

    await annotator.load(complexContextAnnotations, rootElement);

    // Both annotations should be loaded since they match the partial context
    expect(annotator.hasHighlights('complex-1')).toBe(true);
    expect(annotator.hasHighlights('complex-2')).toBe(true);

    // Update to a more specific context that should match only one annotation
    annotator.removeAll();
    annotator.setContext({
      documentId: 'test-document',
      userId: '123',
      projectId: 'project-abc',
    });

    await annotator.load(complexContextAnnotations, rootElement);

    // Only the first annotation should match now
    expect(annotator.hasHighlights('complex-1')).toBe(true);
    expect(annotator.hasHighlights('complex-2')).toBe(false);
  });
});
