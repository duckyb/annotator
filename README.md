# @net7/annotator

[![npm version](https://badge.fury.io/js/%40net7%2Fannotator.svg)](https://www.npmjs.com/package/@net7/annotator)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/net7/annotator/ci.yml)](https://github.com/net7/annotator/actions)

A **framework-agnostic TypeScript library** for anchoring and highlighting text in web documents with intelligent fallback strategies.

## ✨ Features

- 🎯 **Multiple anchoring strategies** with automatic fallback
- 📝 **Text highlighting** with customizable styles
- 🌐 **Framework-agnostic** - works with any JavaScript framework
- 🔧 **TypeScript support** with full type definitions
- 📱 **PDF document support** for complex layouts
- ⚡ **Event-driven architecture** for reactive applications
- 🎨 **Context-aware filtering** for multi-document apps

## 🚀 Quick Start

### Installation

```bash
npm install @net7/annotator
# or
yarn add @net7/annotator
```

### Basic Usage

```typescript
import { Annotator } from '@net7/annotator';

// Create annotator instance
const annotator = new Annotator();

// Set document context
annotator.setContext({ documentId: 'doc-123' });

// Create annotation from user selection
const selection = window.getSelection();
if (selection && selection.rangeCount > 0) {
  const result = annotator.createAnnotation({
    root: document.body,
    range: selection.getRangeAt(0),
    context: { documentId: 'doc-123' },
    color: '#FFFF00',
    metadata: { comment: 'Important note' },
  });

  console.log('Annotation created:', result);
}
```

## 📖 API Reference

### Annotator Class

#### Constructor

```typescript
new Annotator(options?: { allowWhitespace?: boolean })
```

#### Key Methods

| Method                     | Description                            |
| -------------------------- | -------------------------------------- |
| `setContext(context)`      | Set document context for filtering     |
| `createAnnotation(params)` | Create annotation from DOM range       |
| `load(annotations, root)`  | Load multiple annotations              |
| `remove(annotationId)`     | Remove annotation by ID                |
| `getEvents()`              | Get event emitter for highlight events |

### Event Handling

```typescript
// Listen to highlight events
annotator.getEvents().on('highlight', (event) => {
  console.log('Highlight event:', event.type, event.payload);
});
```

## 🏗️ Architecture

The library uses a **smart anchoring system** with automatic fallback:

1. **RangeSelector** (Most precise) - DOM node references
2. **TextPositionSelector** (Reliable) - Character offsets
3. **TextQuoteSelector** (Robust) - Text content matching

When one strategy fails, it automatically tries the next one, ensuring maximum reliability across different document states.

## 📊 Advanced Usage

### Loading Multiple Annotations

```typescript
// Load existing annotations
const annotations = await fetchAnnotations();
annotator.load(annotations, document.body);

// Context-aware filtering
annotator.setContext({
  documentId: 'doc-123',
  pageNumber: 5,
  userId: 'user-456',
});
```

### Custom Event Handling

```typescript
const annotator = new Annotator({ allowWhitespace: true });

annotator.getEvents().on('highlight', (event) => {
  if (event.type === 'click') {
    showAnnotationDetails(event.payload);
  }
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build library
npm run build

# Lint code
npm run lint
```

## 📚 Examples

Check out the [`docs/`](docs/) directory for:

- Basic usage examples
- Advanced demo with full UI
- TypeScript integration examples

## 📄 License

This project is licensed under the **BSD-2-Clause License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Attributions

This library incorporates code from:

- [Hypothesis Client](https://github.com/hypothesis/client) (BSD-2-Clause)
- [dom-anchor-text-quote](https://github.com/tilgovi/dom-anchor-text-quote) (MIT)
- [dom-anchor-text-position](https://github.com/tilgovi/dom-anchor-text-position) (MIT)

See [NOTICE](NOTICE) for complete attribution details.
