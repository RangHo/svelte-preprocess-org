import { execSync } from "node:child_process";
import { join } from 'node:path';

export interface OxSvelteOptions {}

export function convert(content: string, options?: OxSvelteOptions): string {
  let command = `/usr/bin/env emacs --script ${join(import.meta.dirname, 'lisp', 'convert.el')}`;

  return execSync(command, { input: content }).toString();
}
