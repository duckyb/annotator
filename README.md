# Annotator Library

A framework-agnostic TypeScript library for anchoring and highlighting functionality in web documents.

## Overview

This library provides a comprehensive set of tools for creating, managing, and interacting with annotations in web documents. It was extracted from the Digital Philology Hub (DPH) backoffice application to enable reuse across multiple projects.

The library is completely framework-agnostic and can be used with any JavaScript framework or vanilla JavaScript applications.

## Features

- **Text highlighting** in HTML documents
- **PDF document highlighting**
- **Anchoring annotations** to specific positions in documents
- Multiple selector types:
  - XPath-based selection
  - Range-based selection
  - Text quote-based selection
  - Text position-based selection

## Installation

```bash
npm install @net7/annotator
# or
yarn add @net7/annotator
```

## Usage Examples

### Creating a Highlight Annotation

````typescript
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
  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

  try {
    // Create the annotation data and initial highlights
    const result = annotator.createAnnotation({
      root: rootElement,
      range: range,
      context: context
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

The anchors module provides functionality for creating and managing anchors in web documents.

#### TextQuoteAnchor

Creates an anchor based on a text quote.

#### TextPositionAnchor

Creates an anchor based on text position.

#### RangeAnchor

Creates an anchor based on a range.

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Run tests
yarn test
````

## License

MIT
