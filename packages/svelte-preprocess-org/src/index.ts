import { glob } from "tinyglobby";
import type { PreprocessorGroup } from "svelte/compiler";

import { startup } from "./emacs";
import { type OrgExportCustomization } from "./org-export";
import { updateIdLocations } from "./org-id";
import { exportAsSvelte, type OrgSvelteCustomization } from "./org-svelte";

export type OrgPreprocessOptions = Partial<{
  extensions: string[];
  idLocations: string[];
}> &
  OrgExportCustomization &
  OrgSvelteCustomization;

let initPromise: Promise<string> | null = null;

/**
 * Preprocess Org documents to Svelte components.
 */
export function orgPreprocess(
  options?: OrgPreprocessOptions,
): PreprocessorGroup {
  const { extensions = [".org"], idLocations = [], ...rest } = options || {};

  // Initialize Emacs daemon.
  if (!initPromise) {
    initPromise = startup()
      .then(() => glob(idLocations))
      .then((files) => updateIdLocations(files));
  }

  return {
    async markup({ content, filename }) {
      // If the file extension is not in the list of extensions, do nothing.
      if (filename && !extensions.some((ext) => filename.endsWith(ext))) {
        return { code: content };
      }

      // Make sure the prerequisites are met.
      await initPromise;

      return {
        code: await exportAsSvelte(content, rest),
      };
    },
  };
}

export default orgPreprocess;
