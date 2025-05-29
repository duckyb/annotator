import { removeHighlights } from './removeHighlights';
import type { HighlightElement } from './types';
import { highlightRange } from './highlightRange';
import {
  setupTestContainer,
  teardownTestContainer,
  createRangeForText,
} from '../__tests__/utils/highlighter-utils';

// Mock the replaceWith function to test it's being called correctly
jest.mock('./replaceWith', () => ({
  replaceWith: jest
    .fn()
    .mockImplementation((node: HTMLElement, replacements: HTMLElement[]) => {
      // Simple implementation that mimics the actual behavior for testing
      const parent = node.parentNode;
      replacements.forEach((r: HTMLElement) => parent?.insertBefore(r, node));
      node.remove();
    }),
}));

describe('removeHighlights', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = setupTestContainer();
  });

  afterEach(() => {
    teardownTestContainer(container);
    jest.clearAllMocks();
  });

  it('should remove highlights and restore original content', () => {
    // Create content to highlight
    const text = 'This is text that will be highlighted and then removed';
    container.innerHTML = `<p>${text}</p>`;
    const range = createRangeForText(container, text);
    expect(range).not.toBeNull();

    if (range) {
      // Apply highlight
      const highlights = highlightRange({ range });

      // Verify highlights were created
      expect(highlights.length).toBeGreaterThan(0);

      // Store original text content before removing highlights
      const originalText = container.textContent;

      // Get the parent node of the first highlight for later comparison
      const parentNode = highlights[0].parentNode;

      // Remove highlights
      removeHighlights(highlights);

      // Verify the highlights are removed from DOM
      highlights.forEach((highlight) => {
        expect(highlight.parentNode).toBeNull();
      });

      // Verify text content is preserved
      expect(container.textContent).toBe(originalText);

      // Verify parent node still exists (only highlight was removed)
      expect(parentNode).not.toBeNull();
    }
  });

  it('should handle highlights with no parent node', () => {
    // Create a detached highlight element
    const detachedHighlight = document.createElement(
      'span'
    ) as HighlightElement;
    detachedHighlight.className = 'annotator-highlight';
    detachedHighlight.textContent = 'Detached highlight';

    // Try to remove it - should not throw errors
    expect(() => {
      removeHighlights([detachedHighlight]);
    }).not.toThrow();
  });

  it('should remove SVG highlights for PDF documents', () => {
    // Create content to highlight
    const text = 'This is text in a PDF document';
    container.innerHTML = `<p>${text}</p>`;
    const range = createRangeForText(container, text);
    expect(range).not.toBeNull();

    if (range) {
      // Apply highlight
      const highlights = highlightRange({ range }) as HighlightElement[];

      // Mock SVG highlight
      const mockSvgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      const removeSpy = jest.spyOn(mockSvgElement, 'remove');

      // Attach mock SVG to the highlight
      highlights[0].svgHighlight = mockSvgElement;

      // Remove highlights
      removeHighlights(highlights);

      // Verify SVG highlight was removed
      expect(removeSpy).toHaveBeenCalled();
    }
  });

  it('should handle multiple highlights', () => {
    // Create content with multiple paragraphs
    container.innerHTML = `
      <p>First paragraph with text to highlight.</p>
      <p>Second paragraph with more text to highlight.</p>
    `;

    // Create a range that spans multiple elements
    const firstP = container.querySelector('p:first-child');
    const secondP = container.querySelector('p:last-child');
    expect(firstP).not.toBeNull();
    expect(secondP).not.toBeNull();

    if (firstP && secondP) {
      const range = document.createRange();
      range.setStart(firstP.firstChild as Node, 6);
      range.setEnd(secondP.firstChild as Node, 15);

      // Apply highlight
      const highlights = highlightRange({ range });

      // Verify multiple highlights were created
      expect(highlights.length).toBeGreaterThan(1);

      // Store original text content
      const originalText = container.textContent?.replace(/\s+/g, ' ').trim();

      // Remove highlights
      removeHighlights(highlights);

      // Verify all highlights are removed
      highlights.forEach((highlight) => {
        expect(highlight.parentNode).toBeNull();
      });

      // Verify text content is preserved
      expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        originalText
      );
    }
  });

  it('should handle empty highlights array', () => {
    // Should not throw when given an empty array
    expect(() => {
      removeHighlights([]);
    }).not.toThrow();
  });
});
