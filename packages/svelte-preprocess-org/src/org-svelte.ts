import {
  a,
  inputFileVariable,
  k,
  cons,
  list,
  quote,
  type Value,
} from "./emacs";
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
  latexEnvironmentFormat: `${string}%s${string}`;
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
 * Note: This function expects the content of the Org document to be
 * available via `inputFileVariable` (see `emacs.ts`), which `Emacs.run()`
 * binds to a scratch file holding whatever was passed to `minibuffer()`.
 *
 * @returns The generated Svelte component as a string.
 */
export const exportMinibufferAsSvelte = list(
  a`with-temp-buffer`,
  list(a`org-mode`),
  list(a`insert-file-contents`, inputFileVariable),
  list(a`org-svelte-export-as-svelte`),
  list(a`princ`, list(a`buffer-string`)),
);
