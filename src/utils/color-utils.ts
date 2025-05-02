/**
 * Utility functions for color operations
 */

/**
 * Converts a hex color string to an rgba color string
 * @param hex - Hex color code (#RRGGBB)
 * @param alpha - Alpha value (0-1), defaults to 0.3
 * @returns RGBA string in the format rgba(r, g, b, alpha)
 */
export function hexToRgba(hex: string, alpha = 0.3): string {
  // Make sure we have a valid hex value (don't use || which treats empty string as falsy)
  const safeHex = (hex && hex.trim().length > 0) ? hex : '#FFFF00';
  
  // Remove # if present
  const hexColor = safeHex.replace('#', '');
  
  // Parse hex values to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Creates a darker version of a hex color for borders
 * @param hex - Hex color code (#RRGGBB)
 * @returns A darker version of the color for borders
 */
export function getDarkerColor(hex: string): string {
  // Use predefined darker colors for common highlight colors
  if (hex === '#FFFF00') return '#e6c700'; // Yellow border
  if (hex === '#90EE90') return '#4caf50'; // Green border
  if (hex === '#ADD8E6') return '#2196f3'; // Blue border
  if (hex === '#FFB6C1') return '#e91e63'; // Pink border
  
  // For custom colors, create a darker version
  const hexColor = hex.replace('#', '');
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Make each channel darker by reducing values
  const darkerR = Math.max(0, r - 40);
  const darkerG = Math.max(0, g - 40);
  const darkerB = Math.max(0, b - 40);
  
  return `rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.7)`;
}

/**
 * Apply highlight styling to elements based on annotation color
 * @param elements - Array of highlight elements to style
 * @param color - Hex color code to use for styling
 */
export function applyHighlightStyle(elements: HTMLElement[], color: string): void {
  if (!elements || elements.length === 0) return;
  
  const backgroundColor = hexToRgba(color);
  const borderColor = getDarkerColor(color);
  
  elements.forEach(element => {
    // Apply inline styles
    element.style.backgroundColor = backgroundColor;
    element.style.borderBottom = `1px dashed ${borderColor}`;
    
    // Store the original color as an attribute for later reference
    element.setAttribute('data-highlight-color', color);
  });
}
