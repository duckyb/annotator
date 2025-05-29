/**
 * Utilities for comparing DOM nodes and trees etc. in tests or producing
 * representations of them.
 */

/**
 * Elide `text` if it exceeds `length`.
 *
 * @param {string} text
 * @param {number} length
 */
function elide(text: string, length: number) {
  return text.length < length ? text : `${text.slice(0, length)}...`;
}

/**
 * Return a string representation of a node for use in asserts and debugging.
 *
 * @param {Node} node
 */
export function nodeToString(node: Node): string {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return `[Text: ${elide((node as Text).data, 100)}]`;
    case Node.ELEMENT_NODE:
      return `[${(node as Element).localName} element: ${elide((node as Element).innerHTML, 400)}]`;
    case Node.DOCUMENT_NODE:
      return '[Document]';
    case Node.CDATA_SECTION_NODE:
      return '[CData Node]';
    default:
      return '[Other node]';
  }
}

/**
 * Compare two nodes and throw if not equal.
 *
 * This produces more readable output than using `assert.equal(actual, expected)`
 * if there is a mismatch.
 *
 * @returns {boolean} True if nodes are equal, false otherwise
 */
export function assertNodesEqual(actual: Node, expected: Node): boolean {
  return actual === expected;
}

/**
 * Compare two nodes and throw an error if they are not equal.
 * This is used by the custom matcher to provide better error messages.
 */
export function assertNodesEqualWithMessage(actual: Node, expected: Node) {
  if (actual !== expected) {
    return {
      pass: false,
      message: () =>
        `Expected ${nodeToString(actual)} to equal ${nodeToString(expected)}`,
    };
  }
  return {
    pass: true,
    message: () => `Expected nodes not to be equal`,
  };
}
