import { dirname, basename } from "ox-svelte";

import { a, k, cons, list, quote, type Value } from "./emacs";
import { toKebabCase } from "./utilities";

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

export function customize(options: OrgSvelteCustomization = {}) {
  const transformed = Object.entries(options).map(([key, val]) => {
    switch (key) {
      case "componentImportAlist": {
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
      }

      case "metadataExportList": {
        const mel = val as string[];
        return list(
          a`setq`,
          a`org-svelte-metadata-export-list`,
          list(...mel.map((v) => k`${v}`)),
        );
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
        return list(
          a`setq`,
          a`org-svelte-text-markup-alist`,
          list(...Object.entries(tma).map(([key, val]) => cons(key, val))),
        );
      }

      case "anchorFormat":
      case "brokenLinkFormat":
      case "imageFormat":
      case "latexEnviromnetFormat":
      case "latexDisplayFragmentFormat":
      case "latexInlineFragmentFormat":
      case "linkOrgFileAsSvelte":
      case "rawScriptContent":
      case "srcBlockFormat":
      case "verbose":
        return list(a`setq`, a`org-svelte-${toKebabCase(key)}`, val as Value);

      default:
        return null;
    }
  });

  return list(a`progn`, ...transformed);
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
