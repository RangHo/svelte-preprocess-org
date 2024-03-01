import { execSync } from "node:child_process";
import { join } from "node:path";

export interface OxSvelteOptions {
  latexEnvironmentFormat?: string;
  latexFragmentFormat?: string;
  srcBlockFormat?: string;
}

export function convert(content: string, options?: OxSvelteOptions): string {
  const { latexEnvironmentFormat, latexFragmentFormat, srcBlockFormat } =
    options || {};

  let command = `/usr/bin/env emacs --script ${join(
    import.meta.dirname,
    "lisp",
    "convert.el",
  )}`;
  if (latexEnvironmentFormat) {
    command += ` --latex-environment-format ${latexEnvironmentFormat}`;
  }
  if (latexFragmentFormat) {
    command += ` --latex-fragment-format ${latexFragmentFormat}`;
  }
  if (srcBlockFormat) {
    command += ` --src-block-format ${srcBlockFormat}`;
  }

  return execSync(command, { input: content }).toString();
}
