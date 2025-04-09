/**
 * Service for processing text content and calculating offsets
 */
export class TextProcessor {
  /**
   * Get text content and offset from a node up to a specific point
   */
  getTextUpTo(
    node: Node,
    targetNode: Node,
    targetOffset: number
  ): { text: string; offset: number } {
    // Get the full text content and normalize it
    const fullText = node.textContent || '';
    const normalizedText = fullText.replace(/\s+/g, ' ').trim();

    // Calculate the offset by counting normalized text up to the target node
    let offset = 0;
    let normalizedOffset = 0;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let currentNode;

    while ((currentNode = walker.nextNode()) && currentNode !== targetNode) {
      // Normalize the current node's text
      const nodeText = currentNode.textContent || '';
      const normalizedNodeText = nodeText.replace(/\s+/g, ' ').trim();
      if (normalizedNodeText) {
        offset += normalizedNodeText.length;
      }
      normalizedOffset += nodeText.length;
    }

    // If we found the target node, add its offset
    if (currentNode === targetNode) {
      const beforeTarget = (currentNode.textContent || '').substring(
        0,
        targetOffset
      );
      const normalizedBeforeTarget = beforeTarget.replace(/\s+/g, ' ').trim();
      if (normalizedBeforeTarget) {
        // Add a space if this isn't the first text node
        if (normalizedOffset > 0 && offset > 0) {
          offset += 1;
        }
        offset += normalizedBeforeTarget.length;
      }
    }

    return {
      text: normalizedText,
      offset,
    };
  }
}
