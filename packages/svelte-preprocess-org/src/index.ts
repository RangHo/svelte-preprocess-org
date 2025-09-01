import { glob } from "node:fs";
import type { PreprocessorGroup } from "svelte/compiler";
import fullpath from "ox-svelte";

import { Emacs } from "./emacs";
import {
  customize as customizeOx,
  type OrgExportCustomization,
} from "./org-export.js";
import { updateIdLocations } from "./org-id.js";
import {
  customize as customizeOxSvelte,
  exportAsSvelte,
  type OrgSvelteCustomization,
} from "./org-svelte.js";

export type OrgPreprocessOptions = Partial<{
  extensions: string[];
  idLocations: string[];
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
  const { extensions = [".org"], idLocations = [], ...rest } = options || {};

  const emacs = new Emacs();

  // Initialization has not been run yet.
  if (!initPromise) {
    initPromise = emacs
      .require("org")
      .progn(updateIdLocations(idLocations))
      .run();
  }

  return {
    async markup({ content, filename }) {
      // If the file extension is not in the list of extensions, do nothing.
      if (filename && !extensions.some((ext) => filename.endsWith(ext))) {
        return { code: content };
      }

      const code = await emacs
        .require("ox-svelte", fullpath)
        .progn(...customizeOx(rest), ...customizeOxSvelte(rest))
        .progn(exportAsSvelte(rest))
        .minibuffer(content)
        .run();

      console.log("Filename", filename);
      console.log("Transformed:", code);

      return { code };
    },
  };
}

export default orgPreprocess;
