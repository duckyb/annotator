import type { HighlightElement } from './highlighter';

/**
 * Document context for anchoring annotations
 * Can be any object or string that can be used to identify a document context
 */
export type DocumentContext = Record<string, unknown> | string;

/** Custom type for annotations */
export interface Annotation {
  id: string;
  context: Record<string, unknown>;
  serializedBy: string;
  // subject: WebPage;
  color?: string;
  metadata?: Record<string, unknown>; // Custom user data
  rangeSelector?: RangeSelectorWithType;
  textPositionSelector?: TextPositionSelectorWithType;
  textQuoteSelector?: TextQuoteSelectorWithType;
}

export interface AnnotationWithHighlights extends Annotation {
  highlights?: HighlightElement[];
}

/*
 * Anchor types
 */
export enum AnchorEvent {
  Click = 'anchor.click',
  MouseLeave = 'anchor.mouseleave',
  MouseOver = 'anchor.mouseover',
}

export type TextQuoteSelectorWithType = {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
};

export type TextPositionSelectorWithType = {
  type: 'TextPositionSelector';
  start: number;
  end: number;
};

export type RangeSelector = {
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
};

export type RangeSelectorWithType = {
  type: 'RangeSelector';
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
};

export type SelectorWithType =
  | RangeSelectorWithType
  | TextPositionSelectorWithType
  | TextQuoteSelectorWithType;

export type QuerySelectorOptions = {
  hint?: number;
};

export type Anchor = {
  toRange(options: QuerySelectorOptions): Range;
};

export type BrowserNormalizedRange = {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  commonAncestor?: Node;
};

/*
 * WebPage types
 */
export interface TextPositionSelector {
  start: number;
  end: number;
}
export interface TextQuoteSelector {
  exact: string;
  prefix?: string;
  suffix?: string;
}
export interface WebPageFragment {
  text: string;
  rangeSelector: RangeSelector;
  textPositionSelector: TextPositionSelector;
  textQuoteSelector: TextQuoteSelector;
}
export interface WebPageMetadata {
  key: string;
  value: string;
}
export interface WebPage {
  pageTitle: string;
  pageContext: string;
  selected?: WebPageFragment;
  pageFavicon?: string;
  pageMetadata?: WebPageMetadata[];
}

/**
 * Interface for the event emitter
 */
export interface EventEmitterInterface {
  /**
   * Register an event listener
   * @param event The event name to listen for
   * @param callback The callback function to execute when the event occurs
   * @returns A function to remove the listener
   */
  on(event: string, callback: (data: unknown) => void): () => void;

  /**
   * Emit an event with data
   * @param event The event name to emit
   * @param data The data to pass to listeners
   */
  emit(event: string, data: unknown): void;

  /**
   * Remove all listeners for an event
   * @param event The event name to clear listeners for
   */
  removeAllListeners(event?: string): void;
}

export const ANNOTATION_CONSTANTS = {
  CONTEXT_LENGTH: 32,
} as const;
