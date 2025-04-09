import { AnchorEvent } from '../types';
import type { HighlightElement } from './index';

/**
 * Simple event emitter to replace RxJS Subject
 */
class EventEmitter<T> {
  private listeners: ((value: T) => void)[] = [];

  emit(value: T): void {
    this.listeners.forEach(listener => listener(value));
  }

  subscribe(listener: (value: T) => void): { unsubscribe: () => void } {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }
}

interface EventHandlers {
  mouseOver: (event: MouseEvent) => void;
  mouseOut: (event: MouseEvent) => void;
}

// Use Symbol to avoid naming collisions
const HANDLER_KEY = Symbol('highlight_handlers');

interface HighlightElementWithHandlers extends HighlightElement {
  [HANDLER_KEY]?: EventHandlers;
}

/**
 * Manager for highlight elements and their events
 */
export class HighlightManager {
  private events = new EventEmitter<{ type: AnchorEvent; annotationId: string }>();
  events$ = {
    subscribe: (callback: (event: { type: AnchorEvent; annotationId: string }) => void) => {
      return this.events.subscribe(callback);
    }
  };

  /**
   * Attach mouse event handlers to highlight elements
   */
  attachEvents(highlights: HighlightElement[], annotationId: string): void {
    highlights.forEach((el) => {
      const element = el as HighlightElementWithHandlers;
      const handlers: EventHandlers = {
        mouseOver: this.onMouseOver.bind(this, annotationId),
        mouseOut: this.onMouseOut.bind(this, annotationId),
      };

      // Store handlers on the element
      element[HANDLER_KEY] = handlers;

      // FIXME: Attaching events causes Zone.js errors
      // Attach event listeners
      // element.addEventListener('mouseover', handlers.mouseOver);
      // element.addEventListener('mouseout', handlers.mouseOut);
    });
  }

  /**
   * Remove mouse event handlers from highlight elements
   */
  detachEvents(highlights: HighlightElement[]): void {
    highlights.forEach((el) => {
      const element = el as HighlightElementWithHandlers;
      const handlers = element[HANDLER_KEY];

      if (handlers) {
        element.removeEventListener('mouseover', handlers.mouseOver);
        element.removeEventListener('mouseout', handlers.mouseOut);
      }
    });
  }

  private onMouseOver(annotationId: string): void {
    this.events.emit({ type: AnchorEvent.MouseOver, annotationId });
  }

  private onMouseOut(annotationId: string): void {
    this.events.emit({ type: AnchorEvent.MouseLeave, annotationId });
  }
}
