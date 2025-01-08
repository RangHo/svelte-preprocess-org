import { globSync } from "tinyglobby";
import type { PreprocessorGroup } from "svelte/compiler";
import { exportAsSvelte, updateIdLocations, type OxSvelteOptions } from "./emacs.js";

/// Options for Org mode to Svelte preprocessor.
export interface OrgPreprocessorOptions extends OxSvelteOptions {
  /// File extensions to process.
  ///
  /// Default is `[".org"]`.
  extensions?: string[];

  /// List of directories or files to populate the ID cache.
  ///
  /// If this option is specified, a separate instance of Emacs will be run
  /// before the preprocessor is created. This instance will block until all
  /// Org files specified by this option is scanned for IDs.
  idLocations?: string[];
}

export function orgPreprocess(
  options?: OrgPreprocessorOptions,
): PreprocessorGroup {
  const {
    extensions = [".org"],
    idLocations = [],
    ...oxSvelteOptions
  } = options || {};

  // If ID locations are specified, update the ID cache.
  if (idLocations.length > 0) {
    // Convert glob patterns to file paths.
    const files = globSync(idLocations);
    updateIdLocations(files);
  }

  return {
    markup({ content, filename }) {
      // If the file extension is not in the list of extensions, do nothing
      if (filename && !extensions.some((ext) => filename.endsWith(ext))) {
        return { code: content };
      }

      const processed = exportAsSvelte(content, oxSvelteOptions);

      return {
        code: processed,
      };
    },
  };
}

export default orgPreprocess;
