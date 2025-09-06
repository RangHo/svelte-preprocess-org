import fullpath from "ox-svelte";
import type { PreprocessorGroup } from "svelte/compiler";
import { glob } from "tinyglobby";

import { list, quote, a, Emacs, type Sexp } from "./emacs";
import {
  customize as customizeOx,
  type OrgExportCustomization,
} from "./org-export";
import {
  customize as customizeOxSvelte,
  exportMinibufferAsSvelte,
  type OrgSvelteCustomization,
} from "./org-svelte";

/**
 * Options for preprocessing Org documents to Svelte components.
 *
 * See the documentation for `ox` and `ox-svelte` for more details.
 */
export type OrgPreprocessOptions = Partial<{
  /**
   * List of file extensions to process as Org documents.
   */
  extensions: string[];

  /**
   * List of glob patterns to locate Org files for updating ID locations.
   */
  idLocations: string[];

  /**
   * List of extra S-expressions to evaluate during initialization.
   */
  initSexps: Sexp[];
}> &
  OrgExportCustomization &
  OrgSvelteCustomization;

/**
 * Promise that resolves when initialization has been completed.
 */
let initPromise: Promise<unknown> | undefined;

/**
 * Preprocess Org documents to Svelte components.
 */
export function orgPreprocess(
  options?: OrgPreprocessOptions,
): PreprocessorGroup {
  const {
    extensions = [".org"],
    idLocations = [],
    initSexps = [],
    ...rest
  } = options || {};

  // Create a new Emacs instance for this preprocessor.
  const emacs = new Emacs();

  // Initialization has not been run yet.
  if (!initPromise) {
    initPromise = (async () => {
      // Run extra initialization S-expressions if provided.
      if (initSexps.length > 0) {
        await emacs.progn(...initSexps).run();
      }

      // Update Org-mode ID locations if provided.
      if (idLocations.length > 0) {
        const files = await glob(idLocations, { absolute: true });
        if (files.length > 0) {
          await emacs
            .require("org")
            .progn(list(a`org-id-update-id-locations`, quote(list(...files))))
            .run();
        }
      }
    })();
  }

  return {
    async markup({ content, filename }) {
      // If the file extension is not in the list of extensions, do nothing.
      if (filename && !extensions.some((ext) => filename.endsWith(ext))) {
        return { code: content };
      }

      // Make sure that ID location updates have been applied.
      await initPromise;

      const code = await emacs
        .require("ox-svelte", fullpath)
        .progn(customizeOx(rest))
        .progn(customizeOxSvelte(rest))
        .progn(exportMinibufferAsSvelte)
        .minibuffer(content)
        .run();
      return { code };
    },
  };
}

export default orgPreprocess;
