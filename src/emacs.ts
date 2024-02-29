import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export interface OxSvelteOptions {}

export function convert(content: string, options?: OxSvelteOptions): string {
  let command = "/usr/bin/env emacs --script ./lisp/convert.el";

  return execSync(command, { input: content }).toString();
}
