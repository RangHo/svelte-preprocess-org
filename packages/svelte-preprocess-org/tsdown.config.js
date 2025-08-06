import { defineConfig } from "tsdown/config";

import fs from "node:fs";
import path from "node:path";

function copyFile(from, to) {
  return {
    name: "copy-file",
    generateBundle() {
      fs.copyFileSync(path.resolve(from), path.resolve(to));
    },
  };
}

/** @type { import('tsdown/config').UserConfig } */
export default defineConfig({
  sourcemap: process.env.NODE_ENV !== "production",
  plugins: [
    copyFile("./node_modules/ox-svelte/ox-svelte.el", "./dist/ox-svelte.el"),
  ],
});
