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
npm install @h2iosc/annotator
# or
yarn add @h2iosc/annotator
```

## Usage Examples

### Basic Highlighting

```typescript
import { highlightRange } from '@h2iosc/annotator';

// Create a highlight
const range = document.createRange();
range.selectNodeContents(document.getElementById('content'));
const highlights = highlightRange(range, 'span', 'custom-highlight');
```

### Removing Highlights

```typescript
import { removeHighlights } from '@h2iosc/annotator';

// Remove highlights
removeHighlights(highlights);
```

### Creating Annotations with Different Selectors

```typescript
import { 
  TextQuoteAnchor, 
  TextPositionAnchor, 
  RangeAnchor 
} from '@h2iosc/annotator';

// Text quote-based annotation
const quoteAnchor = new TextQuoteAnchor(
  document.body,
  'exact text to match',
  'prefix context',
  'suffix context'
);

// Text position-based annotation
const positionAnchor = new TextPositionAnchor(
  document.body,
  42,  // start position
  56   // end position
);

// Range-based annotation
const rangeAnchor = new RangeAnchor(
  document.body,
  'xpath/to/start/container',
  5,  // start offset
  'xpath/to/end/container',
  10  // end offset
);
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
```

## License

MIT
