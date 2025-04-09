import { TextProcessor } from '../text-range/text-processor';
import { Annotation } from '../types';
import { RangeAnchor } from './range-anchor';
import { TextPositionAnchor } from './text-position-anchor';
import { TextQuoteAnchor } from './text-quote-anchor';
import { ANNOTATION_CONSTANTS } from '../types';

import { generateRandomId } from '../utils/id-generator';

/**
 * Service for creating annotations from user selections
 */
export class AnnotationBuilder {
  constructor(private textProcessor: TextProcessor) {}

  /**
   * Creates an annotation from a user selection
   */
  createAnnotation(
    root: HTMLElement,
    range: Range,
    collationId: string,
    transcriptionId: string,
    nodeId?: string
  ): Annotation {
    // Create different types of anchors from the range
    const rangeAnchor = new RangeAnchor(root, range);
    const rangeSelector = rangeAnchor.toSelector();

    // Get the common ancestor container for the range
    const container = range.commonAncestorContainer;
    const containerElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement);

    if (!containerElement) {
      throw new Error('Could not find container element');
    }

    // Get text content and offsets up to start and end points
    const startInfo = this.textProcessor.getTextUpTo(
      containerElement,
      range.startContainer,
      range.startOffset
    );
    const endInfo = this.textProcessor.getTextUpTo(
      containerElement,
      range.endContainer,
      range.endOffset
    );

    // Get the exact text directly from the range
    // Preserve the exact text including any leading spaces
    const exact = range.toString();

    // Extract context without overlapping the exact text
    // For prefix, get CONTEXT_LENGTH characters before the selection start
    const prefixStart = Math.max(
      0,
      startInfo.offset - ANNOTATION_CONSTANTS.CONTEXT_LENGTH
    );
    const prefixEnd = startInfo.offset;
    // For prefix, only trim leading whitespace (start) but preserve trailing whitespace (end)
    const prefix = startInfo.text
      .substring(prefixStart, prefixEnd)
      .replace(/^\s+/, '');

    // For suffix, get CONTEXT_LENGTH characters after the selection end
    const suffixStart = endInfo.offset;
    const suffixEnd = Math.min(
      endInfo.text.length,
      suffixStart + ANNOTATION_CONSTANTS.CONTEXT_LENGTH
    );
    // For suffix, only trim trailing whitespace (end) but preserve leading whitespace (start)
    const suffix = endInfo.text
      .substring(suffixStart, suffixEnd)
      .replace(/\s+$/, '');

    // Create text quote anchor
    const textQuoteAnchor = new TextQuoteAnchor(root, exact, {
      prefix,
      suffix,
    });
    const textQuoteSelector = textQuoteAnchor.toSelector();

    // Create text position anchor
    const textPositionAnchor = new TextPositionAnchor(
      root,
      startInfo.offset,
      endInfo.offset
    );
    const textPositionSelector = textPositionAnchor.toSelector();

    return {
      id: generateRandomId(),
      collationId,
      transcriptionId,
      nodeId,
      serializedBy: '',
      rangeSelector,
      textPositionSelector,
      textQuoteSelector,
    };
  }
}
