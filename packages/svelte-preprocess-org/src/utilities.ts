/**
 * Convert a lowerCamelCase string to kebab case.
 *
 * @param s The string to convert.
 * @returns The kebab-cased string.
 */
export function toKebabCase(s: string): string {
  return s.replace(
    /[A-Z]+(?!a-z)|[A-Z]/g,
    (match, offset) => (offset > 0 ? "-" : "") + match.toLowerCase(),
  );
}

/**
 * Pause execution synchronously for the given number of milliseconds.
 *
 * @param ms How long to pause for.
 */
export function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
