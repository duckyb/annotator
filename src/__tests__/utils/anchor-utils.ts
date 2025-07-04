/**
 * Shared test utilities for anchor tests
 */

/**
 * Creates and sets up a test container with sample text
 * @returns HTMLDivElement The container element
 */
export function setupTestContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = [
    'Four score and seven years ago our fathers brought forth on this continent,',
    'a new nation, conceived in Liberty, and dedicated to the proposition that',
    'all men are created equal.',
  ].join(' ');
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
 * Creates a range for a specific word in the container
 * @param container The container element
 * @param word The word to create a range for
 * @returns Range | null The created range or null if not possible
 */
export function createRangeForWord(
  container: HTMLElement,
  word: string
): Range | null {
  const range = document.createRange();
  const firstChild = container.firstChild;

  if (!firstChild) {
    return null;
  }

  const text = container.textContent || '';
  const startIndex = text.indexOf(word);

  // Ensure word is found in the text
  if (startIndex === -1) {
    throw new Error(`Test text "${word}" not found in container`);
  }

  const endIndex = startIndex + word.length;

  range.setStart(firstChild, startIndex);
  range.setEnd(firstChild, endIndex);

  return range;
}
