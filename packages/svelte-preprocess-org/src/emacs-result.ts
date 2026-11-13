/**
 * Undo the outer Lisp string-literal quoting that `emacsclient --eval`
 * wraps its reply in (e.g. `"hello \"world\""` -> `hello "world"`).
 *
 * This only reverses `\\` and `\"`, which is all that's needed here: the
 * payload is always JSON text (see `parseEmacsClientResult`), so it never
 * contains a raw control character for Emacs to escape some other way.
 */
export function unwrapLispString(printed: string): string {
  const trimmed = printed.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    throw new Error(
      `Expected Emacs to return a Lisp string, but got: ${printed}`,
    );
  }

  const body = trimmed.slice(1, -1);
  let result = "";
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && i + 1 < body.length) {
      result += body[++i];
    } else {
      result += body[i];
    }
  }

  return result;
}

/**
 * Parse the result of an `emacsclient --eval` call whose return value was
 * produced by `(json-serialize (list :result STRING))` (see `emacs.ts`'s
 * `Emacs.run`).
 *
 * Going through JSON (rather than trying to parse Emacs's own `prin1`/`pp`
 * escaping directly) sidesteps a subtlety: `emacsclient`'s reply channel is
 * line-oriented, so the server forces embedded newlines (and possibly other
 * control characters) in the *returned* string to be escaped for transport
 * -- this happens regardless of `print-escape-newlines` and friends, since
 * it's a wire-protocol necessity rather than an ordinary `prin1` setting.
 * Encoding the payload as JSON first means the only characters the outer
 * Lisp layer ever needs to escape are `"` and `\`, which `unwrapLispString`
 * already handles, and `JSON.parse` reliably handles everything else
 * (newlines, unicode, control characters, ...).
 */
export function parseEmacsClientResult(printed: string): string {
  const json = unwrapLispString(printed);
  return (JSON.parse(json) as { result: string }).result;
}
