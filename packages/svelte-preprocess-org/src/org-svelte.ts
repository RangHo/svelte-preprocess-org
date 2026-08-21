import { a, k, cons, list, quote, type Value } from "./emacs";
import { toKebabCase } from "./utilities";

/**
 * Customization options for exporting Org documents as Svelte components.
 *
 * See the documentation for `ox-svelte` for more details.
 */
export type OrgSvelteCustomization = Partial<{
  /**
   * Format string used to generate anchor (`<a>`) links.
   *
   * Must contain two `%s` specifiers: the first is replaced with the URL
   * of the anchor, the second with the anchor's text.
   *
   * Defaults to `<a href="%s">%s</a>`.
   *
   * See `org-svelte-anchor-format`.
   */
  anchorFormat: `${string}%s${string}%s${string}`;

  /**
   * Format string used to generate broken links.
   *
   * Must contain a single `%s` specifier, replaced with the text of the
   * broken link.
   *
   * Defaults to `<span class="org-broken-link">%s (broken link)</span>`.
   *
   * See `org-svelte-broken-link-format`.
   */
  brokenLinkFormat: string;

  /**
   * Alist of components to import into the generated Svelte file, keyed by
   * module path.
   *
   * A string value imports the module's default export under that name.
   * An array of strings imports those named exports from the module. A
   * `null` value imports nothing. Provide this to make shared components
   * available for rendering certain Org elements (e.g. a custom component
   * for LaTeX fragments).
   *
   * For example:
   * ```ts
   * componentImportAlist: {
   *   "./components/LaTeX.svelte": "LaTeX",
   *   "my-ui-library": ["LaTeX", "CodeBlock"],
   * }
   * ```
   * generates:
   * ```js
   * import LaTeX from "./components/LaTeX.svelte";
   * import { LaTeX, CodeBlock } from "my-ui-library";
   * ```
   *
   * No validation is performed on the given names. Defaults to no imports.
   *
   * See `org-svelte-component-import-alist`.
   */
  componentImportAlist: Record<string, string | string[] | null>;

  /**
   * List of keywords/properties to export as the module's `metadata`
   * object.
   *
   * These are retrieved from the contextual information plist during
   * export. Most are transcoded as plain strings; some (e.g. `title`,
   * `date`) have dedicated transcoding.
   *
   * Defaults to `["title", "subtitle", "description", "date", "language"]`.
   *
   * See `org-svelte-metadata-export-list`.
   */
  metadataExportList: string[];

  /**
   * Format string used to generate image (`<img>`) links.
   *
   * Must contain two `%s` specifiers: the first is replaced with the
   * image's URL, the second with its alt text.
   *
   * Defaults to `<img src="%s" alt="%s" />`.
   *
   * See `org-svelte-image-format`.
   */
  imageFormat: `${string}%s${string}%s${string}`;

  /**
   * Format string used to generate LaTeX environments.
   *
   * Must contain a single `%s` specifier, replaced with the environment's
   * source code as a JavaScript raw string.
   *
   * Defaults to `{@html %s}`, printing the source as raw HTML.
   *
   * See `org-svelte-latex-environment-format`.
   */
  latexEnvironmentFormat: `${string}%s${string}`;

  /**
   * Format string used to generate LaTeX fragments in display mode.
   *
   * Must contain a single `%s` specifier, replaced with the fragment's
   * source code as a JavaScript raw string.
   *
   * Defaults to `{@html %s}`, printing the source as raw HTML.
   *
   * See `org-svelte-latex-display-fragment-format`.
   */
  latexDisplayFragmentFormat: `${string}%s${string}`;

  /**
   * Format string used to generate LaTeX fragments in inline mode.
   *
   * Must contain a single `%s` specifier, replaced with the fragment's
   * source code as a JavaScript raw string.
   *
   * Defaults to `{@html %s}`, printing the source as raw HTML.
   *
   * See `org-svelte-latex-inline-fragment-format`.
   */
  latexInlineFragmentFormat: `${string}%s${string}`;

  /**
   * Whether to rewrite file links pointing to `file.org` so they instead
   * point to `file.svelte`.
   *
   * Useful when other Org files are converted to Svelte components
   * outside of this preprocessor. Defaults to `false`, assuming file
   * links are managed manually.
   *
   * See `org-svelte-link-org-files-as-svelte`.
   */
  linkOrgFileAsSvelte: boolean;

  /**
   * Raw JavaScript code to include verbatim in the module (`<script
   * module>`) context, right after the generated import statements.
   *
   * Must be valid JavaScript, as it is not validated. It is recommended to
   * always terminate statements with semicolons here, since this content
   * is concatenated with generated import statements and metadata.
   *
   * Defaults to an empty string.
   *
   * See `org-svelte-raw-script-content`.
   */
  rawScriptContent: string;

  /**
   * Format string used to generate source code blocks.
   *
   * Must contain two `%s` specifiers: the first is replaced with the
   * block's language, the second with its source code as a JavaScript raw
   * string.
   *
   * Defaults to `<pre><code class="language-%s">{@html %s}</code></pre>`.
   *
   * See `org-svelte-src-block-format`.
   */
  srcBlockFormat: `${string}%s${string}%s${string}`;

  /**
   * Alist of HTML expressions used to render each text markup type.
   *
   * Each format string must contain a single `%s` specifier, replaced
   * with the marked-up text.
   *
   * Defaults to wrapping `bold` in `<b>`, `code` in `<code>`, `italic` in
   * `<i>`, `strike-through` in `<s>`, `underline` in `<u>`, and `verbatim`
   * in `<kbd>`.
   *
   * See `org-svelte-text-markup-alist`.
   */
  textMarkupAlist: Record<
    "bold" | "code" | "italic" | "strike-through" | "underline" | "verbatim",
    `${string}%s${string}`
  >;

  /**
   * Whether to be more verbose (log more messages) during export.
   *
   * Defaults to `false`.
   *
   * See `org-svelte-verbose`.
   */
  verbose: boolean;
}>;

/**
 * Generate Emacs Lisp code to customize the Org to Svelte export engine.
 */
export function customize(options: OrgSvelteCustomization = {}) {
  const transformed = Object.entries(options).flatMap(([key, val]) => {
    switch (key) {
      case "componentImportAlist": {
        const cia = val as Record<string, string | string[] | null>;
        return [
          a`org-svelte-component-import-alist`,
          quote(
            list(
              ...Object.entries(cia).map(([k, v]) => {
                if (Array.isArray(v)) {
                  return cons(k, list(...v));
                } else {
                  return cons(k, v);
                }
              }),
            ),
          ),
        ];
      }

      case "metadataExportList": {
        const mel = val as string[];
        return [
          a`org-svelte-metadata-export-list`,
          quote(list(...mel.map((v) => k`${v}`))),
        ];
      }

      case "textMarkupAlist": {
        const tma = val as Record<
          | "bold"
          | "code"
          | "italic"
          | "strike-through"
          | "underline"
          | "verbatim",
          `${string}%s${string}`
        >;
        return [
          a`org-svelte-text-markup-alist`,
          quote(
            list(...Object.entries(tma).map(([key, val]) => cons(key, val))),
          ),
        ];
      }

      case "anchorFormat":
      case "brokenLinkFormat":
      case "imageFormat":
      case "latexEnvironmentFormat":
      case "latexDisplayFragmentFormat":
      case "latexInlineFragmentFormat":
      case "linkOrgFileAsSvelte":
      case "rawScriptContent":
      case "srcBlockFormat":
      case "verbose":
        return [a`org-svelte-${toKebabCase(key)}`, val as Value];

      default:
        return [];
    }
  });

  return list(a`setq`, ...transformed);
}

/**
 * Export an Org document as Svelte code.
 *
 * Note: This function expects the content of the Org document to be provided
 * via minibuffer input (i.e., stdin).
 *
 * @param options Customization options for the export.
 * @returns The generated Svelte component as a string.
 */
export const exportMinibufferAsSvelte = list(
  a`let`,
  // VARLIST
  list(list(a`content`, ``)),
  // BODY
  list(
    a`while`,
    // TEST
    list(a`setq`, a`line`, list(a`ignore-errors`, list(a`read-string`, ``))),
    // BODY
    list(a`setq`, a`content`, list(a`concat`, a`content`, `\\n`, a`line`)),
  ),
  // Create temporary buffer, insert, and export.
  list(
    a`with-temp-buffer`,
    list(a`org-mode`),
    list(a`insert`, a`content`),
    list(a`org-svelte-export-as-svelte`),
    list(a`princ`, list(a`buffer-string`)),
  ),
);
