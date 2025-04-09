import type { HighlightElement } from './highlighter';

/**
 * Document context for anchoring annotations
 */
export interface DocumentContext {
  transcriptionId: string;
  nodeId?: string;
}

/** Custom type for h2iosc annotations */
export interface Annotation {
  id: string;
  collationId: string;
  nodeId?: string;
  transcriptionId: string;
  serializedBy: string;
  // subject: WebPage;
  color?: string;
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

export const ANNOTATION_CONSTANTS = {
  CONTEXT_LENGTH: 32,
} as const;
