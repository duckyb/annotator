/**
 * Generates a random ID similar to a UUID
 * @returns A random string ID
 */
export function generateRandomId(): string {
  // Create a timestamp component (first part of the ID)
  const timestamp = Date.now().toString(36);

  // Create a random component (second part of the ID)
  const randomPart = Math.random().toString(36).substring(2, 10);

  // Combine with a separator
  return `${timestamp}-${randomPart}`;
}
