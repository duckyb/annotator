/**
 * Main entry point for the Annotator library.
 * Provides a framework-agnostic API for creating, managing, and interacting with annotations.
 */
import type {
  Annotation,
  AnnotationWithHighlights,
  DocumentContext,
  EventEmitterInterface,
} from './types';
import type { HighlightElement } from './highlighter/types';
import { highlightRangeWrapper } from './highlighter/highlightRangeWrapper';
import { removeHighlights } from './highlighter/removeHighlights';
import { RangeAnchor } from './anchors/range-anchor';
import { TextQuoteAnchor } from './anchors/text-quote-anchor';
import { TextPositionAnchor } from './anchors/text-position-anchor';
import { AnnotationBuilder } from './anchors/annotation-builder';
import { TextProcessor } from './text-range/text-processor';
import { HighlightManager } from './highlighter/highlight-manager';
import { EventEmitter } from './event-emitter';

/**
 * Main class for the Annotator library.
 * Handles the creation, updating, and removal of annotation highlights.
 */
export class Annotator {
  private highlights = new Map<string, HighlightElement[]>();
  private orphans: Annotation[] = [];
  private currentContext: DocumentContext | null = null;
  private events: EventEmitterInterface;
  private annotationBuilder: AnnotationBuilder;
  private highlightManager: HighlightManager;
  private options: {
    allowWhitespace: boolean;
  };

  /**
   * Creates a new Annotator instance
   * @param options Configuration options for the annotator
   * @param options.allowWhitespace Whether to allow highlighting of whitespace-only text nodes (default: false)
   */
  constructor(options?: { allowWhitespace?: boolean }) {
    this.events = new EventEmitter();
    const textProcessor = new TextProcessor();
    this.annotationBuilder = new AnnotationBuilder(textProcessor);
    this.highlightManager = new HighlightManager();
    this.currentContext = null;

    // Set default options
    this.options = {
      allowWhitespace: options?.allowWhitespace ?? false,
    };

    // Forward highlight manager events to the annotator events
    this.highlightManager.events$.subscribe((event) => {
      this.events.emit('highlight', {
        type: event.type.toString(),
        payload: event.annotationId,
      });
    });
  }

  /**
   * Get the event emitter to subscribe to events
   * @returns The event emitter instance
   */
  getEvents(): EventEmitterInterface {
    return this.events;
  }

  /**
   * Set the document context for anchoring.
   * @param context The document context, can be any object or string
   */
  setContext(context: DocumentContext): void {
    this.currentContext = context;
  }

  /**
   * Get the current document context
   * @returns The current document context or null if not set
   */
  getContext(): DocumentContext | null {
    return this.currentContext;
  }

  /**
   * Configure the annotator options
   * @param options The options to set
   * @param options.allowWhitespace Whether to allow highlighting of whitespace-only text nodes
   */
  configure(options: { allowWhitespace?: boolean }): void {
    if (options.allowWhitespace !== undefined) {
      this.options.allowWhitespace = options.allowWhitespace;
    }
  }

  /**
   * Get the current configuration options
   * @returns The current configuration options
   */
  getOptions(): { allowWhitespace: boolean } {
    return { ...this.options };
  }

  /**
   * Clear the current document context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  /**
   * Load and display multiple annotations
   * @param annotations The annotations to load
   * @param root The root element to anchor annotations to
   */
  async load(
    annotations: Annotation[],
    root: HTMLElement = document.body
  ): Promise<void> {
    // Filter annotations by the current context if it exists
    this.filterAnnotationsByContext(annotations).forEach((annotation) => {
      this.add(annotation, root);
    });
  }

  /**
   * Add a single annotation to the document
   * @param annotation The annotation to add
   * @param root The root element to anchor the annotation to
   */
  async add(
    annotation: Annotation,
    root: HTMLElement = document.body
  ): Promise<void> {
    if (!this.shouldProcessAnnotation(annotation)) {
      return;
    }

    if (!this.highlights.has(annotation.id)) {
      try {
        this.addHighlights(root, annotation);
      } catch {
        // Store as orphan to try again later
        this.orphans.push(annotation);
      }
    } else {
      // Reattach existing highlights
      this.reattachHighlight(annotation, root);
    }
  }

  /**
   * Reattach highlights for an annotation
   * @param annotation The annotation to reattach highlights for
   * @param root The root element to anchor the annotation to
   */
  reattachHighlight(annotation: Annotation, root: HTMLElement): void {
    if (!this.shouldProcessAnnotation(annotation)) {
      return;
    }

    this.removeHighlights(annotation.id);
    this.addHighlights(root, annotation);
  }

  /**
   * Remove an annotation by ID
   * @param annotationId The ID of the annotation to remove
   */
  remove(annotationId: string): void {
    this.removeHighlights(annotationId);
  }

  /**
   * Remove all annotations
   */
  removeAll(): void {
    this.clear();
  }

  /**
   * Get highlights for an annotation by ID
   * @param annotationId The ID of the annotation
   * @returns The highlight elements or undefined if not found
   */
  getHighlightById(annotationId: string): HighlightElement[] | undefined {
    return this.highlights.get(annotationId);
  }

  /**
   * Check for orphaned annotations and try to reattach them
   */
  checkOrphans(): void {
    const filteredOrphans = this.filterAnnotationsByContext(this.orphans);
    // clear orphans
    this.orphans = [];
    filteredOrphans.forEach((annotation) => {
      this.add(annotation);
    });
  }

  /**
   * Add hover class to highlights for an annotation
   * @param annotationId The ID of the annotation
   */
  addHoverClass(annotationId: string): void {
    const highlights = this.highlights.get(annotationId);
    if (highlights) {
      highlights.forEach((el: HighlightElement) => {
        el.classList.add('is-hovered');
      });
    }
  }

  /**
   * Remove hover class from highlights for an annotation
   * @param annotationId The ID of the annotation
   */
  removeHoverClass(annotationId: string): void {
    const highlights = this.highlights.get(annotationId);
    if (highlights) {
      highlights.forEach((el: HighlightElement) => {
        el.classList.remove('is-hovered');
      });
    }
  }

  /**
   * Create an annotation from a range
   * @param params Object containing the parameters for creating an annotation
   * @param params.root The root element
   * @param params.range The range to create an annotation from
   * @param params.context The context object for the annotation
   * @param params.color Optional color for the annotation
   * @param params.metadata Optional custom data to include with the annotation
   * @returns The created annotation with highlights
   */
  createAnnotation(params: {
    root: HTMLElement;
    range: Range;
    context: Record<string, unknown>;
    color?: string;
    metadata?: Record<string, unknown>;
  }): AnnotationWithHighlights {
    const { root, range, context, color, metadata } = params;

    // Create the annotation using the builder
    const annotation = this.annotationBuilder.createAnnotation({
      root,
      range,
      context,
      metadata,
    });

    // Add the color property, default to yellow if not provided
    annotation.color = color || '#FFFF00';

    // Add highlights
    const highlights = this.addHighlights(root, annotation);

    // Return the annotation with highlights
    return { ...annotation, highlights: highlights || [] };
  }

  /**
   * Reconstruct a range from an annotation
   * @param root The root element
   * @param annotation The annotation to convert to a range
   * @returns The reconstructed range
   */
  annotationToRange(root: HTMLElement, annotation: Annotation): Range {
    if (!this.shouldProcessAnnotation(annotation)) {
      throw new Error(
        'Annotation does not belong to the current document context'
      );
    }

    // Try first with range selector
    if (annotation.rangeSelector) {
      const anchor = RangeAnchor.fromSelector(root, annotation.rangeSelector);
      return anchor.toRange();
    }

    // Fall back to text quote if range fails
    if (annotation.textQuoteSelector) {
      const anchor = TextQuoteAnchor.fromSelector(
        root,
        annotation.textQuoteSelector
      );
      return anchor.toRange();
    }

    // Last resort - use text position
    if (annotation.textPositionSelector) {
      const anchor = TextPositionAnchor.fromSelector(
        root,
        annotation.textPositionSelector
      );
      return anchor.toRange();
    }

    throw new Error('No valid selector found in annotation');
  }

  /**
   * Add highlights for an annotation
   * @param root The root element
   * @param annotation The annotation to highlight
   * @returns The highlight elements
   */
  addHighlights(root: HTMLElement, annotation: Annotation): HighlightElement[] {
    if (!this.shouldProcessAnnotation(annotation)) {
      return [];
    }

    // Check if highlights already exist for this annotation
    if (this.hasHighlights(annotation.id)) {
      // Return existing highlights to avoid duplicates
      return this.getHighlights(annotation.id) || [];
    }

    try {
      const range = this.annotationToRange(root, annotation);
      if (!range) {
        return [];
      }
      // Use the wrapper function to handle the Range to HTMLElement conversion
      const highlights = highlightRangeWrapper({
        range,
        tag: 'span',
        cssClass: 'highlight',
        color: annotation.color,
        allowWhitespace: this.options.allowWhitespace,
      });
      if (highlights && highlights.length) {
        this.highlights.set(annotation.id, highlights);
        this.highlightManager.attachEvents(highlights, annotation.id);
        return highlights;
      } else {
        return [];
      }
    } catch {
      // Return empty array if highlighting fails
      return [];
    }
  }

  /**
   * Remove highlights for an annotation
   * @param annotationId The ID of the annotation
   */
  removeHighlights(annotationId: string): void {
    const highlights = this.highlights.get(annotationId);
    if (!highlights) {
      return;
    }
    this.highlightManager.detachEvents(highlights);
    removeHighlights(highlights);
    // Remove the entry from our tracking map
    this.highlights.delete(annotationId);
  }

  /**
   * Clear all highlights
   */
  clear(): void {
    Array.from(this.highlights.keys()).forEach((id) =>
      this.removeHighlights(id)
    );
  }

  /**
   * Refresh highlights (clear and potentially reapply)
   */
  refresh(): void {
    this.clear();
  }

  /**
   * Check if highlights exist for an annotation
   * @param annotationId The ID of the annotation
   * @returns True if highlights exist
   */
  hasHighlights(annotationId: string): boolean {
    return this.highlights.has(annotationId);
  }

  /**
   * Get highlights for an annotation
   * @param annotationId The ID of the annotation
   * @returns The highlight elements or undefined if not found
   */
  getHighlights(annotationId: string): HighlightElement[] | undefined {
    return this.highlights.get(annotationId);
  }

  /**
   * Filter annotations by the current document context
   * @param annotations The annotations to filter
   * @returns Filtered annotations that match the current context
   */
  filterAnnotationsByContext(annotations: Annotation[]): Annotation[] {
    if (!this.currentContext) {
      return annotations;
    }
    return annotations.filter((annotation) =>
      this.shouldProcessAnnotation(annotation)
    );
  }

  /**
   * Check if an annotation should be processed in the current context
   * @param annotation The annotation to check
   * @returns True if the annotation should be processed, false otherwise
   */
  private shouldProcessAnnotation(annotation: Annotation): boolean {
    if (!this.currentContext) {
      return false;
    }

    // If context is a string, look for it in the annotation context
    if (typeof this.currentContext === 'string') {
      // Check if any context property matches the string
      return Object.values(annotation.context).includes(this.currentContext);
    }

    // If context is an object, check if all properties in currentContext match in annotation.context
    const contextObj = this.currentContext as Record<string, unknown>;
    return Object.entries(contextObj).every(([key, value]) => {
      return annotation.context[key] === value;
    });
  }
}
