declare module 'approx-string-match' {
  export interface Match {
    start: number;
    end: number;
    errors: number;
  }

  function approxSearch(
    text: string,
    pattern: string,
    maxErrors: number
  ): Match[];
  export default approxSearch;
}
