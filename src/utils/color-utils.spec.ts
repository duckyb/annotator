/**
 * Unit tests for color-utils.ts
 */

import { hexToRgba, getDarkerColor, applyHighlightStyle } from './color-utils';

describe('color-utils', () => {
  describe('hexToRgba', () => {
    it('should convert valid hex color to rgba with default alpha', () => {
      const result = hexToRgba('#FF0000');
      expect(result).toBe('rgba(255, 0, 0, 0.3)');
    });

    it('should convert valid hex color to rgba with custom alpha', () => {
      const result = hexToRgba('#00FF00', 0.5);
      expect(result).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('should handle hex color without # prefix', () => {
      const result = hexToRgba('0000FF');
      expect(result).toBe('rgba(0, 0, 255, 0.3)');
    });

    it('should handle hex color with # prefix', () => {
      const result = hexToRgba('#0000FF');
      expect(result).toBe('rgba(0, 0, 255, 0.3)');
    });

    it('should use default yellow color for empty string', () => {
      const result = hexToRgba('');
      expect(result).toBe('rgba(255, 255, 0, 0.3)');
    });

    it('should use default yellow color for whitespace-only string', () => {
      const result = hexToRgba('   ');
      expect(result).toBe('rgba(255, 255, 0, 0.3)');
    });

    it('should use default yellow color for null/undefined input', () => {
      const result1 = hexToRgba(null as any);
      const result2 = hexToRgba(undefined as any);
      expect(result1).toBe('rgba(255, 255, 0, 0.3)');
      expect(result2).toBe('rgba(255, 255, 0, 0.3)');
    });

    it('should handle mixed case hex values', () => {
      const result = hexToRgba('#AbCdEf');
      expect(result).toBe('rgba(171, 205, 239, 0.3)');
    });

    it('should work with zero alpha', () => {
      const result = hexToRgba('#FF0000', 0);
      expect(result).toBe('rgba(255, 0, 0, 0)');
    });

    it('should work with alpha value of 1', () => {
      const result = hexToRgba('#FF0000', 1);
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });
  });

  describe('getDarkerColor', () => {
    it('should return predefined darker color for yellow', () => {
      const result = getDarkerColor('#FFFF00');
      expect(result).toBe('#e6c700');
    });

    it('should return predefined darker color for light green', () => {
      const result = getDarkerColor('#90EE90');
      expect(result).toBe('#4caf50');
    });

    it('should return predefined darker color for light blue', () => {
      const result = getDarkerColor('#ADD8E6');
      expect(result).toBe('#2196f3');
    });

    it('should return predefined darker color for light pink', () => {
      const result = getDarkerColor('#FFB6C1');
      expect(result).toBe('#e91e63');
    });

    it('should create darker version for custom colors', () => {
      const result = getDarkerColor('#FF0000');
      expect(result).toBe('rgba(215, 0, 0, 0.7)');
    });

    it('should handle colors that would go below 0 when darkened', () => {
      const result = getDarkerColor('#200000'); // Very dark red
      expect(result).toBe('rgba(0, 0, 0, 0.7)');
    });

    it('should handle hex without # prefix', () => {
      const result = getDarkerColor('FF0000');
      expect(result).toBe('rgba(215, 0, 0, 0.7)');
    });

    it('should handle mixed case predefined colors', () => {
      const result = getDarkerColor('#ffff00');
      expect(result).toBe('rgba(215, 215, 0, 0.7)'); // Not predefined since case doesn't match
    });

    it('should reduce RGB values by 40 for custom colors', () => {
      const result = getDarkerColor('#808080'); // Gray (128, 128, 128)
      expect(result).toBe('rgba(88, 88, 88, 0.7)'); // Should be (88, 88, 88)
    });
  });

  describe('applyHighlightStyle', () => {
    let mockElements: HTMLElement[];

    beforeEach(() => {
      // Create mock HTML elements
      mockElements = [
        {
          style: {},
          setAttribute: jest.fn(),
        } as any,
        {
          style: {},
          setAttribute: jest.fn(),
        } as any,
      ];
    });

    it('should apply highlight styles to all elements', () => {
      applyHighlightStyle(mockElements, '#FF0000');

      mockElements.forEach((element) => {
        expect(element.style.backgroundColor).toBe('rgba(255, 0, 0, 0.3)');
        expect(element.style.borderBottom).toBe(
          '1px dashed rgba(215, 0, 0, 0.7)'
        );
        expect(element.setAttribute).toHaveBeenCalledWith(
          'data-highlight-color',
          '#FF0000'
        );
      });
    });

    it('should handle empty elements array gracefully', () => {
      expect(() => applyHighlightStyle([], '#FF0000')).not.toThrow();
    });

    it('should handle null/undefined elements gracefully', () => {
      expect(() => applyHighlightStyle(null as any, '#FF0000')).not.toThrow();
      expect(() =>
        applyHighlightStyle(undefined as any, '#FF0000')
      ).not.toThrow();
    });

    it('should apply predefined colors correctly', () => {
      applyHighlightStyle(mockElements, '#FFFF00');

      mockElements.forEach((element) => {
        expect(element.style.backgroundColor).toBe('rgba(255, 255, 0, 0.3)');
        expect(element.style.borderBottom).toBe('1px dashed #e6c700');
        expect(element.setAttribute).toHaveBeenCalledWith(
          'data-highlight-color',
          '#FFFF00'
        );
      });
    });

    it('should work with single element', () => {
      const singleElement = mockElements[0];
      applyHighlightStyle([singleElement], '#00FF00');

      expect(singleElement.style.backgroundColor).toBe('rgba(0, 255, 0, 0.3)');
      expect(singleElement.style.borderBottom).toBe(
        '1px dashed rgba(0, 215, 0, 0.7)'
      );
      expect(singleElement.setAttribute).toHaveBeenCalledWith(
        'data-highlight-color',
        '#00FF00'
      );
    });

    it('should handle different color formats consistently', () => {
      applyHighlightStyle(mockElements, 'FF0000'); // Without #

      mockElements.forEach((element) => {
        expect(element.style.backgroundColor).toBe('rgba(255, 0, 0, 0.3)');
        expect(element.style.borderBottom).toBe(
          '1px dashed rgba(215, 0, 0, 0.7)'
        );
        expect(element.setAttribute).toHaveBeenCalledWith(
          'data-highlight-color',
          'FF0000'
        );
      });
    });
  });
});
