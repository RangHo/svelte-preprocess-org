import process from "node:process";

import { defineConfig } from "tsdown/config";

/** @type { import('tsdown/config').UserConfig } */
export default defineConfig({
  dts: true,
  platform: "node",
  sourcemap: process.env.NODE_ENV !== "production",
});
