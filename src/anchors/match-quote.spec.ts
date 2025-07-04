/**
 * Unit tests for match-quote.ts
 */

import { matchQuote, Context } from './match-quote';

describe('match-quote', () => {
  describe('matchQuote', () => {
    const sampleText =
      'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.';

    it('should return null for empty quote', () => {
      const result = matchQuote(sampleText, '');
      expect(result).toBeNull();
    });

    it('should find exact match', () => {
      const quote = 'Four score and seven years ago';
      const result = matchQuote(sampleText, quote);

      expect(result).not.toBeNull();
      expect(result!.start).toBe(0);
      expect(result!.end).toBe(quote.length);
      expect(result!.score).toBeGreaterThan(0.9);
    });

    it('should find match in middle of text', () => {
      const quote = 'new nation';
      const result = matchQuote(sampleText, quote);

      expect(result).not.toBeNull();
      expect(result!.start).toBe(sampleText.indexOf(quote));
      expect(result!.end).toBe(sampleText.indexOf(quote) + quote.length);
      expect(result!.score).toBeGreaterThan(0.9);
    });

    it('should handle approximate matches', () => {
      const quote = 'Four score and sevn years ago';
      const result = matchQuote(sampleText, quote);

      expect(result).not.toBeNull();
      expect(result!.start).toBe(0);
      expect(result!.score).toBeGreaterThan(0.8);
    });

    it('should return null for quote not found', () => {
      const quote = 'This text is not in the sample at all';
      const result = matchQuote(sampleText, quote);

      expect(result).toBeNull();
    });

    it('should handle empty text', () => {
      const result = matchQuote('', 'some quote');
      expect(result).toBeNull();
    });

    describe('with context', () => {
      it('should use prefix context to improve matching', () => {
        const quote = 'nation';
        const context: Context = { prefix: 'new' };
        const result = matchQuote(sampleText, quote, context);

        expect(result).not.toBeNull();
        expect(result!.start).toBe(sampleText.indexOf('new nation') + 4);
        expect(result!.end).toBe(
          sampleText.indexOf('new nation') + 4 + quote.length
        );
        expect(result!.score).toBeGreaterThan(0.9);
      });

      it('should use suffix context to improve matching', () => {
        const quote = 'nation';
        const context: Context = { suffix: 'conceived' };
        const result = matchQuote(sampleText, quote, context);

        expect(result).not.toBeNull();
        expect(result!.start).toBe(sampleText.indexOf('nation'));
        expect(result!.end).toBe(sampleText.indexOf('nation') + quote.length);
        expect(result!.score).toBeGreaterThan(0.9);
      });

      it('should return null if prefix context does not match', () => {
        const quote = 'nation';
        const context: Context = { prefix: 'old' };
        const result = matchQuote(sampleText, quote, context);

        expect(result).toBeNull();
      });

      it('should return null if suffix context does not match', () => {
        const quote = 'nation';
        const context: Context = { suffix: 'destroyed' };
        const result = matchQuote(sampleText, quote, context);

        expect(result).toBeNull();
      });

      it('should use hint to prefer closer matches', () => {
        const textWithDuplicates =
          'The quick brown fox jumps over the lazy dog. The quick brown fox is fast.';
        const quote = 'quick';
        const context: Context = { hint: 50 };
        const result = matchQuote(textWithDuplicates, quote, context);

        expect(result).not.toBeNull();
        expect(result!.start).toBeGreaterThan(40);
      });
    });

    describe('edge cases', () => {
      it('should handle text with special characters', () => {
        const specialText = "Hello! How are you? I'm fine. What about you?";
        const quote = 'How are you?';
        const result = matchQuote(specialText, quote);

        expect(result).not.toBeNull();
        expect(result!.start).toBe(specialText.indexOf(quote));
        expect(result!.end).toBe(specialText.indexOf(quote) + quote.length);
      });

      it('should handle text with unicode characters', () => {
        const unicodeText = 'Hello 世界! Welcome to the universe 🌍';
        const quote = '世界';
        const result = matchQuote(unicodeText, quote);

        expect(result).not.toBeNull();
        expect(result!.start).toBe(unicodeText.indexOf(quote));
        expect(result!.end).toBe(unicodeText.indexOf(quote) + quote.length);
      });

      it('should handle repeated words', () => {
        const repeatedText = 'test test test test';
        const quote = 'test';
        const result = matchQuote(repeatedText, quote);

        expect(result).not.toBeNull();
        expect(result!.start).toBe(0);
        expect(result!.end).toBe(4);
        expect(result!.score).toBeGreaterThan(0.9);
      });

      it('should handle quote longer than text', () => {
        const shortText = 'short';
        const longQuote =
          'this is a very long quote that is longer than the text';
        const result = matchQuote(shortText, longQuote);

        expect(result).toBeNull();
      });
    });

    describe('scoring', () => {
      it('should return higher score for exact matches', () => {
        const exactQuote = 'Four score and seven';
        const approximateQuote = 'Four scor and sevn'; // Two errors

        const exactResult = matchQuote(sampleText, exactQuote);
        const approximateResult = matchQuote(sampleText, approximateQuote);

        expect(exactResult).not.toBeNull();
        expect(approximateResult).not.toBeNull();
        expect(exactResult!.score).toBeGreaterThan(approximateResult!.score);
      });

      it('should return score between 0 and 1', () => {
        const quote = 'Four score';
        const result = matchQuote(sampleText, quote);

        expect(result).not.toBeNull();
        expect(result!.score).toBeGreaterThanOrEqual(0);
        expect(result!.score).toBeLessThanOrEqual(1);
      });
    });

    describe('multiple matches', () => {
      it('should return best match when multiple candidates exist', () => {
        const textWithMultiple = 'The cat sat on the mat. The cat was fat.';
        const quote = 'cat';
        const context: Context = { suffix: 'was' };

        const result = matchQuote(textWithMultiple, quote, context);

        expect(result).not.toBeNull();
        expect(result!.start).toBeGreaterThan(20);
      });

      it('should prefer match closer to hint', () => {
        const textWithMultiple = 'apple banana apple cherry apple';
        const quote = 'apple';
        const context: Context = { hint: 25 };

        const result = matchQuote(textWithMultiple, quote, context);

        expect(result).not.toBeNull();
        expect(result!.start).toBeGreaterThan(20);
      });
    });
  });
});
