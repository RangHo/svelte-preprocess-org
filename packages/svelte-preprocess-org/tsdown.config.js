import { defineConfig } from "tsdown/config";

/** @type { import('tsdown/config').UserConfig } */
export default defineConfig({
  sourcemap: process.env.NODE_ENV !== "production",
});
