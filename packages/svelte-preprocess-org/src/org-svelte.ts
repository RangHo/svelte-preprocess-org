import { evaluate, a, k, cons, list, quote, type Value } from "./emacs.js";
import { toKebabCase } from "./utilities.js";

/**
 * Customization options for exporting Org documents as Svelte components.
 *
 * See the documentation for `ox-svelte` for more details.
 */
export type OrgSvelteCustomization = Partial<{
  anchorFormat: `${string}%s${string}%s${string}`;
  brokenLinkFormat: string;
  componentImportAlist: Record<string, string | string[] | null>;
  metadataExportList: string[];
  imageFormat: `${string}%s${string}%s${string}`;
  latexEnviromnetFormat: `${string}%s${string}`;
  latexDisplayFragmentFormat: `${string}%s${string}`;
  latexInlineFragmentFormat: `${string}%s${string}`;
  linkOrgFileAsSvelte: boolean;
  rawScriptContent: string;
  srcBlockFormat: `${string}%s${string}%s${string}`;
  textMarkupAlist: Record<
    "bold" | "code" | "italic" | "strike-through" | "underline" | "verbatim",
    `${string}%s${string}`
  >;
  verbose: boolean;
}>;

/**
 * Export an Org document as Svelte code.
 *
 * @param content The content of the Org-mode document.
 * @param options Customization options for the export.
 * @returns The generated Svelte component as a string.
 */
export function exportAsSvelte(
  content: string,
  options?: OrgSvelteCustomization,
) {
  options = options || {};

  const transformedOptions = Object.entries(options).map(([key, val]) => {
    switch (key) {
      case "componentImportAlist":
        const cia = val as Record<string, string | string[] | null>;
        return list(
          a`setq`,
          a`org-svelte-component-import-alist`,
          list(
            ...Object.entries(cia).map(([k, v]) => {
              if (Array.isArray(v)) {
                return cons(k, list(...v));
              } else {
                return cons(k, v);
              }
            }),
          ),
        );

      case "metadataExportList":
        const mel = val as string[];
        return list(
          a`setq`,
          a`org-svelte-metadata-export-list`,
          list(...mel.map((v) => k`${v}`)),
        );

      case "textMarkupAlist":
        const tma = val as Record<
          | "bold"
          | "code"
          | "italic"
          | "strike-through"
          | "underline"
          | "verbatim",
          `${string}%s${string}`
        >;
        return list(
          a`setq`,
          a`org-svelte-text-markup-alist`,
          list(...Object.entries(tma).map(([key, val]) => cons(key, val))),
        );

      default:
        return list(a`setq`, a`org-svelte-${toKebabCase(key)}`, val as Value);
    }
  });

  // Build the `progn` form.
  const sexp = list(
    a`progn`,
    // Import `ox-svelte`.
    list(
      a`require`,
      quote(a`ox-svelte`),
      list(a`expand-file-name`, `ox-svelte.el`, import.meta.dirname),
    ),
    // Include the transformed export options.
    ...transformedOptions,
    // Read the content of the Org document from stdin.
    list(a`setq`, a`content`, ``),
    list(
      a`while`,
      // TEST
      list(
        a`setq`,
        a`line`,
        list(a`ignore-errors`, list(a`read-from-minibuffer`, ``)),
      ),
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

  // Evaluate with Emacs.
  const result = evaluate(sexp, content);
  return result;
}
