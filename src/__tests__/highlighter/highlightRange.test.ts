import { highlightRange } from '../../highlighter/highlightRange';
import type { HighlightElement } from '../../highlighter/types';
import { setupTestContainer, teardownTestContainer, createRangeForText, createMockPdfEnvironment } from './test-utils';

// Mock the drawHighlightsAbovePdfCanvas function
jest.mock('../../highlighter/drawHighlightsAbovePdfCanvas', () => ({
  drawHighlightsAbovePdfCanvas: jest.fn().mockImplementation((_: HTMLElement) => {
    // Check if this is a PDF environment by looking for the canvas
    const canvas = document.querySelector('.pdf-canvas');
    if (canvas) {
      // Create a mock SVG rect element
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      return rect;
    }
    return null;
  })
}));

describe('highlightRange', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = setupTestContainer();
  });

  afterEach(() => {
    teardownTestContainer(container);
    jest.clearAllMocks();
  });

  describe('basic highlighting', () => {
    it('should highlight text within a range', () => {
      // Create a range for text in a paragraph
      const text = 'paragraph with';
      const range = createRangeForText(container, text, { exactMatch: false });
      expect(range).not.toBeNull();

      if (range) {
        // Apply highlight
        const highlights = highlightRange({ range });

        // Verify highlights were created
        expect(highlights.length).toBeGreaterThan(0);
        expect(highlights[0]).toBeInstanceOf(HTMLElement);
        expect(highlights[0].className).toBe('highlight');
        expect(highlights[0].textContent).toContain(text);
      }
    });

    it('should use custom tag and class when provided', () => {
      const text = 'bold text';
      const range = createRangeForText(container, text);
      expect(range).not.toBeNull();

      if (range) {
        const customTag = 'mark';
        const customClass = 'custom-highlight';
        
        // Apply highlight with custom parameters
        const highlights = highlightRange({
          range,
          tag: customTag,
          cssClass: customClass
        });

        // Verify custom parameters were used
        expect(highlights.length).toBeGreaterThan(0);
        expect(highlights[0].tagName.toLowerCase()).toBe(customTag);
        expect(highlights[0].className).toBe(customClass);
        expect(highlights[0].getAttribute('part')).toBe(customClass);
      }
    });

    it('should apply color styling when color is provided', () => {
      const text = 'italic text';
      const range = createRangeForText(container, text);
      expect(range).not.toBeNull();

      if (range) {
        const color = '#FF0000'; // Red
        
        // Apply highlight with color
        const highlights = highlightRange({
          range,
          color
        });

        // Verify color was applied
        expect(highlights.length).toBeGreaterThan(0);
        expect(highlights[0].style.backgroundColor).toBe('rgba(255, 0, 0, 0.3)');
        expect(highlights[0].getAttribute('data-highlight-color')).toBe(color);
      }
    });
  });

  describe('whitespace handling', () => {
    it('should not highlight whitespace-only nodes by default', () => {
      // Create a container with whitespace
      const whiteSpaceContainer = document.createElement('div');
      whiteSpaceContainer.innerHTML = '<p>Text with    multiple spaces</p>';
      document.body.appendChild(whiteSpaceContainer);
      
      try {
        // Create a range that only includes whitespace
        const textNode = whiteSpaceContainer.querySelector('p')?.firstChild;
        expect(textNode).not.toBeNull();
        
        if (textNode) {
          const range = document.createRange();
          // Select just the whitespace between "with" and "multiple"
          range.setStart(textNode, 9);  // After "Text with"
          range.setEnd(textNode, 13);   // Before "multiple"
          
          // Apply highlight with default settings (allowWhitespace = false)
          const highlights = highlightRange({ range });
          
          // Verify no highlights were created for whitespace
          expect(highlights.length).toBe(0);
        }
      } finally {
        whiteSpaceContainer.remove();
      }
    });

    it('should highlight whitespace when allowWhitespace is true', () => {
      // Create a container with whitespace
      const whiteSpaceContainer = document.createElement('div');
      whiteSpaceContainer.innerHTML = '<p>Text with    multiple spaces</p>';
      document.body.appendChild(whiteSpaceContainer);
      
      try {
        // Create a range that only includes whitespace
        const textNode = whiteSpaceContainer.querySelector('p')?.firstChild;
        expect(textNode).not.toBeNull();
        
        if (textNode) {
          const range = document.createRange();
          // Select just the whitespace between "with" and "multiple"
          range.setStart(textNode, 9);  // After "Text with"
          range.setEnd(textNode, 13);   // Before "multiple"
          
          // Apply highlight with allowWhitespace = true
          const highlights = highlightRange({ 
            range,
            allowWhitespace: true
          });
          
          // Verify highlights were created for whitespace
          expect(highlights.length).toBe(1);
          expect(highlights[0].textContent).toBe('    ');
        }
      } finally {
        whiteSpaceContainer.remove();
      }
    });

    it('should not highlight whitespace in restricted parent elements even with allowWhitespace=true', () => {
      // Create a table with a TR element (which is in the restricted parents list)
      const restrictedContainer = document.createElement('div');
      restrictedContainer.innerHTML = '<table><tr><td>  Cell with spaces  </td></tr></table>';
      document.body.appendChild(restrictedContainer);
      
      try {
        // Get the TR element which is a restricted parent
        const trElement = restrictedContainer.querySelector('tr');
        expect(trElement).not.toBeNull();
        
        if (trElement) {
          // Add a text node with only whitespace directly to the TR (invalid HTML but useful for testing)
          const whitespaceNode = document.createTextNode('   ');
          trElement.appendChild(whitespaceNode);
          
          // Create a range for the whitespace
          const range = document.createRange();
          range.setStart(whitespaceNode, 0);
          range.setEnd(whitespaceNode, 3);
          
          // Apply highlight with allowWhitespace = true
          const highlights = highlightRange({ 
            range,
            allowWhitespace: true
          });
          
          // Verify no highlights were created for whitespace in TR element
          expect(highlights.length).toBe(0);
        }
      } finally {
        restrictedContainer.remove();
      }
    });
  });

  describe('PDF highlighting', () => {
    let pdfEnv: {
      canvas: HTMLCanvasElement;
      textLayer: HTMLDivElement;
      container: HTMLDivElement;
      cleanup: () => void;
    };

    beforeEach(() => {
      pdfEnv = createMockPdfEnvironment();
    });

    afterEach(() => {
      pdfEnv.cleanup();
    });

    it('should create SVG highlights for text in PDF documents', () => {
      // Find a text node in the PDF text layer
      const text = 'This text can be highlighted';
      const range = createRangeForText(pdfEnv.textLayer, text, { exactMatch: false });
      expect(range).not.toBeNull();

      if (range) {
        // Apply highlight
        const highlights = highlightRange({ range });

        // Verify highlights were created
        expect(highlights.length).toBeGreaterThan(0);
        
        // Check that the highlight has the transparent class
        expect(highlights[0].className).toContain('is-transparent');
        
        // Check that the svgHighlight property was set
        expect((highlights[0] as HighlightElement).svgHighlight).not.toBeNull();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle collapsed ranges (no text selected)', () => {
      // Create a collapsed range
      const range = document.createRange();
      const textNode = container.querySelector('p')?.firstChild;
      expect(textNode).not.toBeNull();
      
      if (textNode) {
        range.setStart(textNode, 5);
        range.setEnd(textNode, 5);
        
        // Apply highlight to collapsed range
        const highlights = highlightRange({ range });
        
        // Verify no highlights were created
        expect(highlights.length).toBe(0);
      }
    });

    it('should handle ranges that span multiple nodes', () => {
      // Create a range that spans multiple nodes
      const range = document.createRange();
      const firstP = container.querySelector('p');
      const secondP = container.querySelectorAll('p')[1];
      expect(firstP).not.toBeNull();
      expect(secondP).not.toBeNull();
      
      if (firstP && secondP) {
        range.setStart(firstP.firstChild as Node, 5);
        range.setEnd(secondP.firstChild as Node, 10);
        
        // Apply highlight
        const highlights = highlightRange({ range });
        
        // Verify multiple highlights were created
        expect(highlights.length).toBeGreaterThan(1);
      }
    });

    it('should handle ranges within annotator-placeholder elements', () => {
      // Create a container with a placeholder
      const placeholderContainer = document.createElement('div');
      placeholderContainer.innerHTML = '<div class="annotator-placeholder"><span>Placeholder text</span></div>';
      document.body.appendChild(placeholderContainer);
      
      try {
        // Create a range in the placeholder
        const text = 'Placeholder text';
        const range = createRangeForText(placeholderContainer, text);
        expect(range).not.toBeNull();
        
        if (range) {
          // Apply highlight
          const highlights = highlightRange({ range });
          
          // Verify highlights were created but without SVG highlights
          expect(highlights.length).toBeGreaterThan(0);
          expect(highlights[0].className).not.toContain('is-transparent');
          expect((highlights[0] as HighlightElement).svgHighlight).toBeUndefined();
        }
      } finally {
        placeholderContainer.remove();
      }
    });
  });
});
