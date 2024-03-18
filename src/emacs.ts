import { execSync } from "node:child_process";
import { join } from "node:path";

import { Atom, Quote, cons, list, stringify } from "./sexp.js";

export interface OxSvelteOptions {
  latexEnvironmentFormat?: string;
  latexFragmentFormat?: string;
  srcBlockFormat?: string;
  imports?: Record<string, string>;
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
    command += ` --latex-environment-format '${latexEnvironmentFormat.replaceAll(
      "'",
      "'\\''",
    )}'`;
  }
  if (latexFragmentFormat) {
    command += ` --latex-fragment-format '${latexFragmentFormat.replaceAll(
      "'",
      "'\\''",
    )}'`;
  }
  if (srcBlockFormat) {
    command += ` --src-block-format '${srcBlockFormat.replaceAll("'", "'\\''")}'`;
  }
  if (imports) {
    const sexp = list(
      new Atom("setq"),
      new Atom("org-svelte-component-import-alist"),
      new Quote(
        list(...Object.entries(imports).map(([key, val]) => cons(key, val))),
      ),
    );
    command += ` --preface '${stringify(sexp).replaceAll("'", "'\\''")}'`;
  }

  const result = execSync(command, { input: content }).toString();

  return result;
}
