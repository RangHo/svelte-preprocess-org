import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { orgPreprocess } from "svelte-preprocess-org";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    orgPreprocess({
      anchorFormat: "<Link href=%s>%s</Link>",
      componentImportAlist: {
        "$lib/components/link.svelte": "Link",
      },
      extensions: [".org"],
      idLocations: ["src/lib/orgs/*.org"],
      initDirectory: "/tmp/svelte-preprocess-org",
      verbose: true,
    }),
    vitePreprocess(),
  ],
  extensions: [".svelte", ".org"],
  kit: {
    adapter: adapter(),
  },
};

export default config;
