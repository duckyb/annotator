// Basic usage example of the annotator library

// Import the necessary components
// For local development, import directly from the local build
import {
  highlightRange,
  removeHighlights,
  TextQuoteAnchor,
  TextPositionAnchor,
  RangeAnchor,
  AnnotationBuilder,
  TextProcessor,
} from '../dist/index.esm.js';

// Example 1: Basic highlighting
function basicHighlighting() {
  // Get some content to highlight
  const contentElement = document.getElementById('content');

  // Create a range
  const range = document.createRange();
  range.selectNodeContents(contentElement);

  // Apply highlighting
  const highlights = highlightRange(range, 'span', 'custom-highlight');

  // Later, remove the highlights
  setTimeout(() => {
    removeHighlights(highlights);
  }, 3000);
}

// Example 2: Creating an annotation
function createAnnotation() {
  if (!isBrowser) return;

  const contentElement = document.getElementById('content');
  const textProcessor = new TextProcessor();
  const annotationBuilder = new AnnotationBuilder(textProcessor);

  // Create a range
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  // Create an annotation
  const annotation = annotationBuilder.createAnnotation(
    contentElement,
    range,
    'collation-123',
    'transcription-456'
  );

  console.log('Created annotation:', annotation);

  // You can use the annotation's selectors to recreate the annotation later
  return annotation;
}

// Example 3: Using different anchor types
function useAnchors() {
  if (!isBrowser) return;

  const contentElement = document.getElementById('content');

  // Text quote-based anchor
  const quoteAnchor = new TextQuoteAnchor(
    contentElement,
    'exact text to match',
    {
      prefix: 'text before the ',
      suffix: ' in the document',
    }
  );

  // Get the range for this anchor
  const quoteRange = quoteAnchor.toRange();

  // Highlight it
  const quoteHighlights = highlightRange(quoteRange, 'span', 'quote-highlight');

  // Text position-based anchor
  const positionAnchor = new TextPositionAnchor(
    contentElement,
    42, // start position
    56 // end position
  );

  // Get the range for this anchor
  const positionRange = positionAnchor.toRange();

  // Highlight it
  const positionHighlights = highlightRange(
    positionRange,
    'span',
    'position-highlight'
  );

  // Range-based anchor
  const rangeAnchor = new RangeAnchor(
    contentElement,
    'xpath/to/start/container',
    5, // start offset
    'xpath/to/end/container',
    10 // end offset
  );

  // Get the range for this anchor
  const rangeAnchorRange = rangeAnchor.toRange();

  // Highlight it
  const rangeHighlights = highlightRange(
    rangeAnchorRange,
    'span',
    'range-highlight'
  );

  // Clean up all highlights
  setTimeout(() => {
    removeHighlights([
      ...quoteHighlights,
      ...positionHighlights,
      ...rangeHighlights,
    ]);
  }, 5000);
}

// Only run in browser environment
if (isBrowser) {
  // Run the examples when the page loads
  window.addEventListener('DOMContentLoaded', () => {
    // Add a button to trigger each example
    const exampleButtons = [
      { name: 'Basic Highlighting', fn: basicHighlighting },
      { name: 'Create Annotation', fn: createAnnotation },
      { name: 'Use Different Anchors', fn: useAnchors },
    ];

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    exampleButtons.forEach((example) => {
      const button = document.createElement('button');
      button.textContent = example.name;
      button.addEventListener('click', example.fn);
      buttonContainer.appendChild(button);
    });

    document.body.insertBefore(buttonContainer, document.body.firstChild);
  });
}
