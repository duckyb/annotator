/**
 * Set whether highlights under the given root element should be visible.
 *
 * @param {HTMLElement} root
 * @param {boolean} visible
 */
export function setHighlightsVisible(root: HTMLElement, visible: boolean) {
  const showHighlightsClass = `${'highlightTag'}s-always-on`;
  root.classList.toggle(showHighlightsClass, visible);
}
