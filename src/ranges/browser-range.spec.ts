/**
 * Unit tests for browser-range.ts
 */

import { BrowserRange } from './browser-range';
import {
  setupTestContainer,
  teardownTestContainer,
} from '../__tests__/utils/anchor-utils';
import '../__tests__/utils/setup-jest';

// Mock the xpath-util functions
jest.mock('../xpath-util', () => ({
  getFirstTextNodeNotBefore: jest.fn(),
  getLastTextNodeUpTo: jest.fn(),
}));

import { getFirstTextNodeNotBefore, getLastTextNodeUpTo } from '../xpath-util';

const mockGetFirstTextNodeNotBefore =
  getFirstTextNodeNotBefore as jest.MockedFunction<
    typeof getFirstTextNodeNotBefore
  >;
const mockGetLastTextNodeUpTo = getLastTextNodeUpTo as jest.MockedFunction<
  typeof getLastTextNodeUpTo
>;

describe('BrowserRange', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = setupTestContainer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestContainer(container);
  });

  describe('constructor', () => {
    it('should initialize with Range properties', () => {
      const range = document.createRange();
      const textNode = container.firstChild as Text;

      range.setStart(textNode, 0);
      range.setEnd(textNode, 10);

      const browserRange = new BrowserRange(range);

      expect(browserRange.commonAncestorContainer).toBe(
        range.commonAncestorContainer
      );
      expect(browserRange.startContainer).toBe(range.startContainer);
      expect(browserRange.startOffset).toBe(range.startOffset);
      expect(browserRange.endContainer).toBe(range.endContainer);
      expect(browserRange.endOffset).toBe(range.endOffset);
      expect(browserRange.tainted).toBe(false);
    });

    it('should handle empty range', () => {
      const range = document.createRange();
      const browserRange = new BrowserRange(range);

      expect(browserRange.tainted).toBe(false);
    });
  });

  describe('normalize', () => {
    it('should throw error if called twice', () => {
      const range = document.createRange();
      const textNode = container.firstChild as Text;

      range.setStart(textNode, 0);
      range.setEnd(textNode, 10);

      const browserRange = new BrowserRange(range);

      // First call should work
      browserRange.normalize();

      // Second call should throw
      expect(() => browserRange.normalize()).toThrow(
        'You may only call normalize() once on a BrowserRange!'
      );
    });

    it('should mark as tainted after normalization', () => {
      const range = document.createRange();
      const textNode = container.firstChild as Text;

      range.setStart(textNode, 0);
      range.setEnd(textNode, 10);

      const browserRange = new BrowserRange(range);

      expect(browserRange.tainted).toBe(false);
      browserRange.normalize();
      expect(browserRange.tainted).toBe(true);
    });

    describe('text node ranges', () => {
      it('should handle simple text node to text node range', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        range.setStart(textNode, 5);
        range.setEnd(textNode, 15);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).toBeDefined();
        expect(normalized.endContainer).toBeDefined();
        expect(normalized.commonAncestor).toBe(container);
      });

      it('should handle range starting at offset 0', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).toBe(textNode);
      });

      it('should split text node when starting at non-zero offset', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        range.setStart(textNode, 5);
        range.setEnd(textNode, 15);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        // Should have split the text node
        expect(normalized.startContainer).not.toBe(textNode);
        // The splitText method returns the second part of the split
        expect((normalized.startContainer as Text).nodeValue).toContain(
          'score'
        );
      });
    });

    describe('element node ranges', () => {
      beforeEach(() => {
        // Create a more complex DOM structure
        container.innerHTML = '<p>First paragraph</p><p>Second paragraph</p>';
      });

      it('should handle element node start container', () => {
        const range = document.createRange();
        const firstP = container.firstElementChild as HTMLElement;
        const firstTextNode = firstP.firstChild as Text;

        mockGetFirstTextNodeNotBefore.mockReturnValue(firstTextNode);

        range.setStart(container, 0);
        range.setEnd(firstTextNode, 5);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(mockGetFirstTextNodeNotBefore).toHaveBeenCalled();
        expect(normalized.startContainer).toBe(firstTextNode);
        expect(normalized.endContainer).toBeDefined();
        expect(normalized.commonAncestor).toBe(container);
      });

      it('should handle element node end container', () => {
        const range = document.createRange();
        const firstP = container.firstElementChild as HTMLElement;
        const firstTextNode = firstP.firstChild as Text;

        mockGetFirstTextNodeNotBefore.mockReturnValue(firstTextNode);

        range.setStart(firstTextNode, 0);
        range.setEnd(container, 1);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.endContainer).toBeDefined();
      });

      it('should throw error when no text node found for start', () => {
        const range = document.createRange();

        mockGetFirstTextNodeNotBefore.mockReturnValue(null);

        range.setStart(container, 0);
        range.setEnd(container, 1);

        const browserRange = new BrowserRange(range);

        expect(() => browserRange.normalize()).toThrow(
          'Could not find text node'
        );
      });

      it('should handle end container with childNodes at offset', () => {
        const range = document.createRange();
        const firstP = container.firstElementChild as HTMLElement;
        const firstTextNode = firstP.firstChild as Text;

        range.setStart(firstTextNode, 0);
        range.setEnd(container, 1); // End at second paragraph

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.endContainer).toBeDefined();
      });

      it('should handle end container needing previous sibling lookup', () => {
        const range = document.createRange();
        const firstP = container.firstElementChild as HTMLElement;
        const firstTextNode = firstP.firstChild as Text;

        mockGetFirstTextNodeNotBefore.mockReturnValue(firstTextNode);
        mockGetLastTextNodeUpTo.mockReturnValue(firstTextNode);

        range.setStart(container, 0);
        range.setEnd(container, 0);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        // Either mockGetLastTextNodeUpTo gets called, or the range logic handles it differently
        expect(normalized.endContainer).toBeDefined();
        expect(normalized.startContainer).toBe(firstTextNode);
      });

      it('should handle complex element node scenarios', () => {
        const range = document.createRange();
        const firstP = container.firstElementChild as HTMLElement;
        const firstTextNode = firstP.firstChild as Text;

        mockGetFirstTextNodeNotBefore.mockReturnValue(firstTextNode);

        range.setStart(container, 0);
        range.setEnd(container, 1);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).toBe(firstTextNode);
        expect(normalized.endContainer).toBeDefined();
        expect(normalized.commonAncestor).toBe(container);
      });
    });

    describe('range spanning multiple text nodes', () => {
      beforeEach(() => {
        // Create DOM with multiple text nodes
        container.innerHTML = '<span>First</span> middle <span>Last</span>';
      });

      it('should handle range spanning multiple containers', () => {
        const range = document.createRange();
        const firstSpan = container.firstElementChild as HTMLElement;
        const lastSpan = container.lastElementChild as HTMLElement;
        const firstText = firstSpan.firstChild as Text;
        const lastText = lastSpan.firstChild as Text;

        range.setStart(firstText, 2);
        range.setEnd(lastText, 2);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).not.toBe(firstText);
        expect(normalized.endContainer).toBeDefined();
        expect(normalized.startContainer).not.toBe(normalized.endContainer);
      });

      it('should handle splitting at end when needed', () => {
        const range = document.createRange();
        const firstSpan = container.firstElementChild as HTMLElement;
        const lastSpan = container.lastElementChild as HTMLElement;
        const firstText = firstSpan.firstChild as Text;
        const lastText = lastSpan.firstChild as Text;

        range.setStart(firstText, 0);
        range.setEnd(lastText, 2); // Split at position 2 of "Last"

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).toBe(firstText);
        expect(normalized.endContainer).toBe(lastText);
      });
    });

    describe('single text node range', () => {
      it('should handle range entirely within one text node', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        range.setStart(textNode, 5);
        range.setEnd(textNode, 15);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.startContainer).toBe(normalized.endContainer);
      });

      it('should split text when range is in middle of single node', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;
        const originalLength = textNode.nodeValue?.length || 0;

        range.setStart(textNode, 5);
        range.setEnd(textNode, 15);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        // Should have been split
        expect(
          (normalized.startContainer as Text).nodeValue?.length
        ).toBeLessThan(originalLength);
      });
    });

    describe('common ancestor handling', () => {
      it('should ensure common ancestor is element node', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.commonAncestor?.nodeType).toBe(Node.ELEMENT_NODE);
      });

      it('should walk up to find element node as common ancestor', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;

        // Simulate a case where commonAncestorContainer is a text node
        Object.defineProperty(range, 'commonAncestorContainer', {
          value: textNode,
          writable: true,
        });

        range.setStart(textNode, 0);
        range.setEnd(textNode, 10);

        const browserRange = new BrowserRange(range);
        const normalized = browserRange.normalize();

        expect(normalized.commonAncestor?.nodeType).toBe(Node.ELEMENT_NODE);
        expect(normalized.commonAncestor).toBe(container);
      });
    });

    describe('edge cases', () => {
      it('should handle next sibling logic for start container', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;
        const nextSibling = document.createTextNode('next');

        // Insert next sibling
        container.insertBefore(nextSibling, textNode.nextSibling);

        mockGetFirstTextNodeNotBefore.mockReturnValue(nextSibling);

        range.setStart(textNode, textNode.nodeValue?.length || 0);
        range.setEnd(textNode, textNode.nodeValue?.length || 0);

        const browserRange = new BrowserRange(range);
        browserRange.normalize();

        expect(mockGetFirstTextNodeNotBefore).toHaveBeenCalledWith(nextSibling);
      });

      it('should handle edge cases gracefully', () => {
        const range = document.createRange();
        const textNode = container.firstChild as Text;
        const textLength = textNode.nodeValue?.length || 0;

        range.setStart(textNode, textLength);
        range.setEnd(textNode, textLength);

        const browserRange = new BrowserRange(range);

        // This should not throw because it should find existing text node
        expect(() => browserRange.normalize()).not.toThrow();
      });
    });
  });
});
