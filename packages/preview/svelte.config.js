import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { orgPreprocess } from "svelte-preprocess-org";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess(), orgPreprocess()],

  kit: {
    adapter: adapter(),
  },
};

export default config;
