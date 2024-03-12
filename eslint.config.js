import eslint from "@eslint/js";
import tslint from "typescript-eslint";

const config = tslint.config(
  eslint.configs.recommended,
  ...tslint.configs.recommended,
);

export default config;
