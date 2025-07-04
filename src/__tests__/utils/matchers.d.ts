// Extend Jest matchers with our custom matchers
declare namespace jest {
  interface Matchers<R> {
    toEqualNode(expected: Node): R;
  }
}
