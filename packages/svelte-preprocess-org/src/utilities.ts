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
