# Annotator Library

A framework-agnostic TypeScript library for anchoring and highlighting functionality in web documents.

## Overview

This library provides a comprehensive set of tools for creating, managing, and interacting with annotations (highlights + metadata) in web documents.

The library is completely framework-agnostic and can be used with any JavaScript framework or vanilla JavaScript applications.

## Features

- **Text highlighting** in HTML documents
- **PDF document highlighting**
- **Anchoring annotations** to specific positions in documents
- Multiple selector types with intelligent fallback:
  - **RangeSelector** - Most precise, uses exact DOM node references
  - **TextPositionSelector** - Uses character offsets from document start
  - **TextQuoteSelector** - Uses exact text matching with optional prefix/suffix
  - **XPath-based selection** (legacy support)

## Installation

```bash
npm install @net7/annotator
# or
yarn add @net7/annotator
```

## Usage Examples

### Creating a Highlight Annotation

```typescript
import { Annotator } from '@net7/annotator';

// --- Example function to create annotation from user selection ---
function createAnnotationFromSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    console.log('No text selected.');
    return;
  }

  const range = selection.getRangeAt(0);

  // --- Provide necessary details (replace with your application's logic) ---
  const rootElement = document.body; // Or your specific content root

  // Define your annotation context with properties relevant to your application
  const context = {
    documentId: 'doc-123',
    pageNumber: 5,
    // Add any other context properties needed for your application
  };

  // Define custom metadata for this annotation
  const metadata = {
    createdBy: 'user@example.com',
    tags: ['important', 'review'],
    comment: 'This section needs review',
    likes: 0,
  };
  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

  try {
    // Create the annotation data and initial highlights
    const result = annotator.createAnnotation({
      root: rootElement,
      range: range,
      context: context,
      metadata: metadata,
    });
    console.log('Annotation created:', result.annotation);
    console.log('Highlight elements:', result.highlights);

    // Optional: Clear the browser selection highlight
    selection.removeAllRanges();
  } catch (error) {
    console.error('Error creating annotation:', error);
    // Handle cases where the range might be invalid, etc.
  }
}

// Example usage: Call this function when a user clicks a button, for example.
// createAnnotationFromSelection();
```

## API Documentation

### Highlighter Module

The highlighter module provides functionality for creating and managing highlights in web documents.

#### `highlightRange(range, tag, cssClass)`

Wraps the DOM Nodes within the provided range with a highlight element of the specified class.

- `range`: DOM Range to be highlighted
- `tag`: HTML tag to use for the highlight element (default: 'span')
- `cssClass`: CSS class to use for the highlight (default: 'highlight')
- Returns: Array of HighlightElement objects

#### `removeHighlights(highlights)`

Removes the specified highlights from the document.

- `highlights`: Array of HighlightElement objects to remove

### Anchors Module

## Selector Priority and Fallback Strategy

The annotation library uses a sophisticated fallback strategy when anchoring annotations to ensure maximum reliability across different document states and environments.

### Priority Order

When multiple selectors are available for an annotation, the library tries them in the following order:

1. **RangeSelector** (Highest Priority)

   - Uses exact DOM node references with start/end containers and offsets
   - Most precise and fastest when the document structure hasn't changed
   - May fail if DOM nodes have been modified or regenerated

2. **TextPositionSelector** (Medium Priority)

   - Uses character offsets from the beginning of the document
   - Reliable when document content is stable but DOM structure may change
   - Less sensitive to minor DOM modifications

3. **TextQuoteSelector** (Fallback Priority)
   - Uses exact text content with optional prefix and suffix context
   - Most robust against document changes, relies on text content matching
   - Can handle significant DOM restructuring as long as text content remains

### Quote Assertion

When a `TextQuoteSelector` is present, the library performs **quote assertion** on results from `RangeSelector` and `TextPositionSelector`:

- If the selected text doesn't match the expected quote text, a "quote mismatch" error is thrown
- The system then falls back to the next selector in priority order
- This ensures annotation accuracy and prevents anchoring to wrong content

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Run tests
yarn test
```

## License

MIT
