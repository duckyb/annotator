/**
 * Return all text node descendants of `parent`.
 *
 * @param {Node} parent
 * @return {Text[]}
 */
export function getTextNodes(parent: Node): Text[] {
  const nodes: Text[] = [];
  Array.from(parent.childNodes).forEach((node) => {
    // We test `nodeType` here rather than using `instanceof` because we have
    // tests where `node` comes from a different iframe.
    if (node.nodeType === Node.TEXT_NODE) {
      nodes.push(node as Text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      nodes.push(...getTextNodes(node));
    }
  });
  return nodes;
}
