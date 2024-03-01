import { execSync } from "node:child_process";
import { join } from "node:path";

export interface OxSvelteOptions {
  latexEnvironmentFormat?: string;
  latexFragmentFormat?: string;
  srcBlockFormat?: string;
  imports?: Record<string, string>;
}

function recordToAlist(target: Record<string, string>): string {
  const entries = Object.entries(target);
  const alist = entries.map(([key, val]) => `("${key}" . "${val}")`);
  return `'(${alist})`;
}

export function convert(content: string, options?: OxSvelteOptions): string {
  const {
    latexEnvironmentFormat,
    latexFragmentFormat,
    srcBlockFormat,
    imports,
  } = options || {};

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
  if (imports) {
    command += ` --preface "(setq og-svelte-component-import-alist ${recordToAlist(
      imports,
    )})"`;
  }

  return execSync(command, { input: content }).toString();
}
