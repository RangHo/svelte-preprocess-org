import { spawnSync } from "node:child_process";

import { Sexp, a, q, cons, call, list, stringify } from "./sexp.js";

/**
 * An additional import entry.
 */
export interface AdditionalImport {
  binding: string | [string];

  module: string;
}

/**
 * Options available for the `convert.el` helper script.
 *
 * This interface is essentially a JavaScript-friendly version of the custom
 * variables of the `ox-svelte` package. For more information or to see the
 * default values, refer to the documentation of the `ox-svelte` package.
 */
export interface OxSvelteOptions {
  /**
   * The format string to transcode link elements.
   */
  anchorFormat?: string;

  /**
   * The format string to transcode image elements.
   */
  imageFormat?: string;

  /**
   * The format string to transcode LaTeX environments.
   */
  latexEnvironmentFormat?: string;

  /**
   * The format string to transcode LaTeX fragments.
   */
  latexFragmentFormat?: string;

  /**
   * The format string to transcode source code blocks.
   */
  srcBlockFormat?: string;

  /**
   * List of additional components to import.
   */
  additionalComponents?: [AdditionalImport];
}

export function updateIdLocations(locations: string[]): void {
  const sexp = call(
    "progn",
    call("require", q(a`org`)),
    call("require", q(a`org-id`)),
    call("org-id-update-id-locations", q(list(...locations))),
  );

  evaluate(sexp, "");
}

/**
 * Convert an Org-mode document to a Svelte component.
 *
 * @param content The content of the Org-mode document.
 * @param options Options for the conversion.
 * @returns The generated Svelte component.
 */
export function exportAsSvelte(content: string, options?: OxSvelteOptions): string {
  const {
    additionalComponents = [],
    ...rest
  } = options || {};

  // Build the additional components association list.
  const additionalComponentsSexp = list(
    ...additionalComponents.map((entry) => {
      if (Array.isArray(entry.binding)) {
        // If the binding is an array, it is a destructuring import.
        return cons(list(...entry.binding), entry.module);
      } else {
        // otherwise, it is a default import.
        return cons(entry.binding, entry.module);
      }
    })
  );

  // Build the `progn` form.
  const sexp = call(
    "progn",
    // Import `ox-svelte`.
    call("require", q(a`ox-svelte`), call("expand-file-name", "ox-svelte.el", import.meta.dirname)),
    // Set export options.
    call("setq", a`org-svelte-component-import-alist`, q(additionalComponentsSexp)),
    ...Object.entries(rest).map(([key, value]) => call(
        "setq",
        a`org-svelte-${toKebabCase(key)}`,
        value,
      ),
    ),
    // Read the content of the Org document from stdin.
    call("setq", a`content`, ""),
    call(
      "while",
      // TEST
      call("setq", a`line`, call("ignore-errors", call("read-from-minibuffer", ""))),
      // BODY
      call("setq", a`content`, call("concat", a`content`, "\\n", a`line`)),
    ),
    call(
      "with-temp-buffer",
      call("org-mode"),
      call("insert", a`content`),
      call("org-svelte-export-as-svelte"),
      call("princ", call("buffer-string")),
    ),
  );

  const result = evaluate(sexp, content);
  return result;
}

/**
 * Convert a lowerCamelCase string to kebab case.
 *
 * @param s The string to convert.
 * @returns The kebab-cased string.
 */
function toKebabCase(s: string): string {
  return s.replace(
    /[A-Z]+(?!a-z)|[A-Z]/g,
    (match, offset) => (offset > 0 ? "-" : "") + match.toLowerCase()
  );
}

/**
 * Evaluate the given S-expression in a new instance of Emacs.
 */
function evaluate(sexp: Sexp, stdin: string): string {
  const process = spawnSync("emacs", ["--batch", "--eval", stringify(sexp), "--kill"], {
    input: stdin,
    maxBuffer: 10 * 1024 * 1024, // 10MB
  });

  const result = process.stdout.toString();
  return result
}
