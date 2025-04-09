// Main library exports
export * from './types';
export { Annotator } from './annotator';
export { EventEmitter } from './event-emitter';

// Highlighter exports
export * from './highlighter/types';
export * from './highlighter/highlightRange';
export * from './highlighter/highlightRangeWrapper';
export * from './highlighter/drawHighlightsAbovePdfCanvas';
export * from './highlighter/getBoundingClientRect';
export * from './highlighter/getHighlightsContainingNode';
export * from './highlighter/getPdfCanvas';
export * from './highlighter/highlight-manager';
export * from './highlighter/isCSSPropertySupported';
export * from './highlighter/removeAllHighlights';
export * from './highlighter/removeHighlights';
export * from './highlighter/replaceWith';
export * from './highlighter/setHighlightsFocused';
export * from './highlighter/setHighlightsVisible';
export * from './highlighter/wholeTextNodesInRange';

// Anchors exports
export * from './anchors/annotation-builder';
export * from './anchors/range-anchor';
export * from './anchors/text-position-anchor';
export * from './anchors/text-quote-anchor';

// HTML exports
export * from './html';

// PDF exports
export * from './pdf';

// Ranges exports
export * from './ranges';

// Selection exports
export * from './selection';

// Selectors exports
export * from './selectors';

// Text-range exports
export * from './text-range';

// XPath exports
export * from './xpath';
export * from './xpath-util';

// Helpers
export * from './helpers';
export * from './range-util';

// Utils
export * from './utils';
