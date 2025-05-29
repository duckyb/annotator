/**
 * Integration test for the annotation editing functionality
 *
 * This test verifies the end-to-end flow of editing an existing annotation,
 * ensuring that modifications are correctly applied and persisted.
 */

import { Annotator } from '../../annotator';
import {
  setupTestContainer,
  createRangeForText,
} from '../utils/highlighter-utils';
import type { AnnotationWithHighlights } from '../../types';

describe('Annotation Editing Flow', () => {
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

  it('should allow editing the color of an existing annotation', () => {
    // 1. Create an initial annotation
    const initialRange = createRangeForText(container, 'bold text');
    expect(initialRange).toBeDefined();

    const selection = window.getSelection();
    expect(selection).toBeDefined();
    selection!.removeAllRanges();
    selection!.addRange(initialRange!);

    const initialAnnotation: AnnotationWithHighlights =
      annotator.createAnnotation({
        root: container,
        range: initialRange!,
        context: { documentId: 'test-document' },
        color: '#FFEB3B', // Yellow
        metadata: {
          type: 'initial-test',
          createdAt: new Date().toISOString(),
        },
      });

    expect(initialAnnotation).toBeDefined();
    expect(initialAnnotation.id).toBeDefined();
    expect(initialAnnotation.highlights).toBeDefined();
    expect(initialAnnotation.highlights?.length).toBeGreaterThan(0);
    initialAnnotation.highlights?.forEach((h) => {
      expect(h.style.backgroundColor).toBe('rgba(255, 235, 59, 0.3)'); // Check initial color
      expect(container.contains(h)).toBe(true);
    });

    // 2. Define the new color
    const newColor = '#4CAF50'; // Green
    const newRgbColor = 'rgba(76, 175, 80, 0.3)';

    // 3. Remove the original highlights
    annotator.removeHighlights(initialAnnotation.id);
    // Verify highlights are removed from the DOM and annotator's tracking
    initialAnnotation.highlights?.forEach((h) =>
      expect(container.contains(h)).toBe(false)
    );
    expect(annotator.getHighlightById(initialAnnotation.id)).toBeUndefined();

    // 4. Update the color property on the annotation object
    initialAnnotation.color = newColor;

    // 5. Add new highlights using the modified annotation object
    const newHighlightElements = annotator.addHighlights(
      container,
      initialAnnotation
    );
    expect(newHighlightElements).toBeDefined();
    expect(newHighlightElements.length).toBeGreaterThan(0);

    // Update the local annotation object's highlights property for consistency
    initialAnnotation.highlights = newHighlightElements;

    // 6. Verify the new highlights have the updated color and are in the DOM
    // Check highlights stored in the annotator
    const currentHighlightsInAnnotator = annotator.getHighlightById(
      initialAnnotation.id
    );
    expect(currentHighlightsInAnnotator).toBeDefined();
    expect(currentHighlightsInAnnotator?.length).toBeGreaterThan(0);
    currentHighlightsInAnnotator?.forEach((h) => {
      expect(h.style.backgroundColor).toBe(newRgbColor);
      expect(container.contains(h)).toBe(true);
    });

    // Also check the highlights on our local annotation object
    expect(initialAnnotation.highlights).toBeDefined();
    initialAnnotation.highlights?.forEach((h) =>
      expect(h.style.backgroundColor).toBe(newRgbColor)
    );
  });

  it('should allow adding a comment to an annotation metadata', () => {
    // 1. Create an initial annotation
    const initialRange = createRangeForText(container, 'bold text'); // Use existing text from setup
    expect(initialRange).toBeDefined();

    const selection = window.getSelection();
    expect(selection).toBeDefined();
    selection!.removeAllRanges();
    selection!.addRange(initialRange!);

    const initialAnnotation: AnnotationWithHighlights =
      annotator.createAnnotation({
        root: container,
        range: initialRange!,
        context: { documentId: 'test-document' },
        color: '#FFEB3B', // Yellow
        metadata: {
          type: 'initial-test',
          createdAt: new Date().toISOString(),
        },
      });

    expect(initialAnnotation).toBeDefined();
    expect(initialAnnotation.metadata).toBeDefined();
    expect(initialAnnotation.metadata!.type).toBe('initial-test');
    expect(initialAnnotation.metadata!.comment).toBeUndefined(); // Ensure no comment initially

    // 2. Add a comment to the annotation's metadata
    const testComment = 'This is a test comment.';
    // Ensure metadata object exists before adding to it (though createAnnotation should have made it)
    if (!initialAnnotation.metadata) {
      initialAnnotation.metadata = {};
    }
    initialAnnotation.metadata.comment = testComment;
    initialAnnotation.metadata.updatedAt = new Date().toISOString();

    // 3. Verify the comment is present in the annotation's metadata
    expect(initialAnnotation.metadata.comment).toBe(testComment);
    expect(initialAnnotation.metadata.type).toBe('initial-test'); // Ensure other metadata is preserved
    expect(initialAnnotation.metadata.updatedAt).toBeDefined();
  });
});
