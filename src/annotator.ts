/**
 * Main entry point for the Annotator library.
 * Provides a framework-agnostic API for creating, managing, and interacting with annotations.
 */
import type { 
  Annotation, 
  AnnotationWithHighlights, 
  DocumentContext,
  EventEmitterInterface
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

  /**
   * Creates a new Annotator instance
   */
  constructor() {
    this.events = new EventEmitter();
    const textProcessor = new TextProcessor();
    this.annotationBuilder = new AnnotationBuilder(textProcessor);
    this.highlightManager = new HighlightManager();
    this.currentContext = null;
    
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
   * @param transcriptionId The ID of the variant
   * @param nodeId The ID of the document page (optional)
   */
  setContext(transcriptionId: string, nodeId?: string): void {
    this.currentContext = { transcriptionId, nodeId };
  }

  /**
   * Get the current document context
   * @returns The current document context or null if not set
   */
  getContext(): DocumentContext | null {
    return this.currentContext;
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
   * @param root The root element
   * @param range The range to create an annotation from
   * @param collationId The collation ID
   * @param transcriptionId The transcription ID
   * @param nodeId Optional node ID
   * @returns The created annotation with highlights
   */
  createAnnotation(
    root: HTMLElement,
    range: Range,
    collationId: string,
    transcriptionId: string,
    nodeId?: string
  ): AnnotationWithHighlights {
    // Create the annotation using the builder
    const annotation = this.annotationBuilder.createAnnotation(
      root,
      range,
      collationId,
      transcriptionId,
      nodeId
    );

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
      const highlights = highlightRangeWrapper(range);
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
   * Determine if an annotation should be processed based on the current context
   * @param annotation The annotation to check
   * @returns True if the annotation should be processed
   */
  private shouldProcessAnnotation(annotation: Annotation): boolean {
    if (!this.currentContext) {
      return true; // If no context is set, process all annotations
    }
    // First check if the annotation belongs to the current transcription
    if (annotation.transcriptionId !== this.currentContext.transcriptionId) {
      return false;
    }
    // If nodeId is specified in the context, check if the annotation belongs to this page
    if (this.currentContext.nodeId && annotation.nodeId) {
      return annotation.nodeId === this.currentContext.nodeId;
    }
    // If we have a context nodeId but annotation doesn't, or vice versa, still allow it
    // This handles cases where some annotations might not have page information
    return true;
  }
}
