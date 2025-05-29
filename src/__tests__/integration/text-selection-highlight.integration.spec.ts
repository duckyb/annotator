/**
 * Integration test for the text selection to highlight flow
 *
 * This test verifies the end-to-end flow from text selection to highlight creation,
 * ensuring that different modules work together correctly.
 */

import { Annotator } from '../../annotator';
import {
  setupTestContainer,
  createRangeForText,
} from '../utils/highlighter-utils';

describe('Text Selection to Highlight Flow', () => {
  let container: HTMLElement;
  let annotator: Annotator;

  beforeEach(() => {
    // Set up test container with default content
    container = setupTestContainer();
    document.body.appendChild(container);

    // Initialize the annotator
    annotator = new Annotator({ allowWhitespace: true });
    annotator.setContext({
      documentId: 'test-document',
    });
  });

  afterEach(() => {
    // Clean up after each test
    if (container && container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  });

  it('should create a highlight for selected text', () => {
    // 1. Create a range for the text "bold text" which exists in our test content
    const range = createRangeForText(container, 'bold text');
    if (!range) {
      throw new Error('Failed to create range for text');
    }

    // 2. Create a selection
    const selection = window.getSelection();
    if (!selection) {
      throw new Error('No selection object available');
    }

    selection.removeAllRanges();
    selection.addRange(range);

    // 3. Create an annotation using the annotator
    const annotation = annotator.createAnnotation({
      root: container,
      range,
      context: { documentId: 'test-document' },
      color: '#FFEB3B',
      metadata: {
        type: 'test',
        createdAt: new Date().toISOString(),
      },
    });

    // 4. Verify the annotation was created correctly
    expect(annotation).toBeDefined();
    expect(annotation.highlights).toBeDefined();
    expect(annotation.highlights?.length).toBeGreaterThan(0);

    // 5. Verify the highlights are in the document
    annotation.highlights?.forEach((highlight) => {
      expect(container.contains(highlight)).toBe(true);
      expect(highlight.classList.contains('highlight')).toBe(true);
    });

    // 6. Verify the text content is preserved
    expect(container.textContent).toContain('bold text');
  });

  it('should maintain correct text content after highlighting', () => {
    // 1. Get the original text content
    const originalText = container.textContent;

    // 2. Create a range for the text "special content" which exists in our test content
    const range = createRangeForText(container, 'special content');
    if (!range) {
      throw new Error('Failed to create range for text');
    }

    // 3. Create an annotation using the annotator
    const annotation = annotator.createAnnotation({
      root: container,
      range,
      context: { documentId: 'test-document' },
      color: '#FFEB3B',
    });

    // 4. Verify the overall text content remains the same
    expect(container.textContent).toBe(originalText);

    // 5. Verify the highlighted portion is wrapped in a highlight element
    expect(annotation.highlights?.length).toBeGreaterThan(0);
    annotation.highlights?.forEach((highlight) => {
      expect(highlight.textContent).toBe('special content');
    });
  });
});
