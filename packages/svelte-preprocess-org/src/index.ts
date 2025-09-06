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

export type OrgPreprocessOptions = Partial<{
  extensions: string[];
  idLocations: string[];
  initSexps: Sexp[];
}> &
  OrgExportCustomization &
  OrgSvelteCustomization;

/**
 *
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
