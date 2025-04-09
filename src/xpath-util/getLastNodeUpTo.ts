/**
 * Determine the last text node inside or before the given node.
 */
export function getLastTextNodeUpTo(node: ChildNode): Node | null {
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return node; // We have found our text node.
    case Node.ELEMENT_NODE:
      // This is an element, we need to dig in
      if (node.lastChild) {
        // Does it have children at all?
        const result = getLastTextNodeUpTo(node.lastChild);
        if (result) {
          return result;
        }
      }
      break;
    default:
      break;
  }
  // Could not find a text node in current node, go backwards
  const prev = node.previousSibling;
  if (prev) {
    return getLastTextNodeUpTo(prev);
  }
  return null;
}
