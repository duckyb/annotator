// This file is loaded before running tests
import { expect } from '@jest/globals';
import { assertNodesEqualWithMessage } from './compare-dom';

// Custom matchers implementation
expect.extend({
  toEqualNode(actual: Node, expected: Node) {
    // Use the function that returns the proper Jest matcher result
    return assertNodesEqualWithMessage(actual, expected);
  },
});

export {};
