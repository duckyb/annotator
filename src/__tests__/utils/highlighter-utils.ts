/**
 * Shared test utilities for highlighter tests
 */

/**
 * Creates and sets up a test container with sample text
 * @returns HTMLDivElement The container element
 */
export function setupTestContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = [
    '<p>This is a paragraph with <b>bold text</b> and <i>italic text</i>.</p>',
    '<p>This is another paragraph with some <span class="special">special content</span>.</p>',
    '<ul><li>List item 1</li><li>List item 2</li></ul>',
    '<table><tr><td>Table cell</td></tr></table>',
  ].join('\n');
  document.body.appendChild(container);
  return container;
}

/**
 * Removes a container from the document
 * @param container The container to remove
 */
export function teardownTestContainer(container: HTMLElement): void {
  container.remove();
}

/**
 * Creates a range for a specific text within a container
 * @param container The container element
 * @param text The text to find and create a range for
 * @param options Options for range creation
 * @returns Range | null The created range or null if not possible
 */
export function createRangeForText(
  container: HTMLElement,
  text: string,
  options: {
    startOffset?: number;
    endOffset?: number;
    exactMatch?: boolean;
  } = {}
): Range | null {
  const range = document.createRange();
  const { startOffset = 0, endOffset, exactMatch = true } = options;

  // Find the text node containing the text
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const content = node.textContent || '';
    const index = content.indexOf(text);

    if (index !== -1) {
      // If exactMatch is true, only match if the text node contains exactly the text
      if (exactMatch && content !== text && content.trim() !== text) {
        continue;
      }

      const start = index + startOffset;
      const end =
        endOffset !== undefined ? index + endOffset : index + text.length;

      range.setStart(node, start);
      range.setEnd(node, end);
      return range;
    }
  }

  return null;
}

/**
 * Creates a mock PDF canvas environment for testing
 * @returns Object with canvas, textLayer, and container elements
 */
export function createMockPdfEnvironment() {
  // Create the container for the PDF page
  const pageContainer = document.createElement('div');
  pageContainer.className = 'page';

  // Create the canvas element that would be rendered by PDF.js
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  canvas.className = 'pdf-canvas';

  // Create the text layer that would be rendered above the canvas
  const textLayer = document.createElement('div');
  textLayer.className = 'textLayer';
  textLayer.style.position = 'absolute';
  textLayer.style.top = '0';
  textLayer.style.left = '0';
  textLayer.style.width = '100%';
  textLayer.style.height = '100%';

  // Add some text content to the text layer
  textLayer.innerHTML = `
    <span>This is text in a PDF document. </span>
    <span>This text can be highlighted. </span>
    <span>Multiple highlights can be applied.</span>
  `;

  // Assemble the page
  pageContainer.appendChild(canvas);
  pageContainer.appendChild(textLayer);
  document.body.appendChild(pageContainer);

  return {
    canvas,
    textLayer,
    container: pageContainer,
    cleanup: () => pageContainer.remove(),
  };
}
