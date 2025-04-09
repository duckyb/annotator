import { getPathSegment } from './getPathSegment';

/**
 * A simple XPath generator which can generate XPaths of the form
 * /tag[index]/tag[index].
 *
 * @param {Node} node - The node to generate a path to
 * @param {Node} root - Root node to which the returned path is relative
 */
export function xpathFromNode(node: Node | null, root: HTMLElement | Document) {
  let xpath = '';
  let elem = node;
  while (elem !== root) {
    if (!elem) {
      throw new Error('Node is not a descendant of root');
    }
    xpath = `${getPathSegment(elem)}/${xpath}`;

    // // Handle Shadow DOM traversal
    // if (elem.parentNode === null && (elem as any).host) {
    //   // We've hit a shadow root, move to the host element
    //   elem = (elem as any).host;
    // } else {
    elem = elem.parentNode;
    // }
  }
  xpath = `/${xpath}`;
  xpath = xpath.replace(/\/$/, ''); // Remove trailing slash

  return xpath;
}
