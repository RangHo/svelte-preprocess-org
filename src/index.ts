import type { PreprocessorGroup } from "svelte/compiler";
import { convert, type OxSvelteOptions } from "./emacs.js";

export interface OrgPreprocessorOptions extends OxSvelteOptions {
  extensions?: string[];
}

export function orgPreprocess(
  options?: OrgPreprocessorOptions,
): PreprocessorGroup {
  const { extensions = [".org"], ...oxSvelteOptions } = options || {};

  return {
    markup({ content, filename }) {
      // If the file extension is not in the list of extensions, do nothing
      if (filename && !extensions.some((ext) => filename.endsWith(ext))) {
        return { code: content };
      }

      const processed = convert(content, oxSvelteOptions);

      return {
        code: processed,
      };
    },
  };
}

export default orgPreprocess;
