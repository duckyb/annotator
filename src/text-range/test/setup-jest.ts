// This file is loaded before running tests
import { expect } from '@jest/globals';
import { assertNodesEqualWithMessage } from './compare-dom';

// Add type definitions for the custom matcher
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toEqualNode(expected: Node): R;
    }
  }
}

// Add custom matchers
expect.extend({
  toEqualNode(actual: Node, expected: Node) {
    // Use the function that returns the proper Jest matcher result
    return assertNodesEqualWithMessage(actual, expected);
  },
});

export {};
