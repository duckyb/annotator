import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualNode(expected: Node): R;
    }
  }
}
