import js from "@eslint/js";
import ts from "typescript-eslint";

/** @type { import("eslint").Linter.Config[] } */
const config = ts.config(
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  ts.configs.recommended,
);

export default config;
