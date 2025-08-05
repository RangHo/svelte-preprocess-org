import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * An S-expression.
 */
export type Sexp = Value | Cell;

/**
 * A value in an S-expression.
 */
export type Value = Atom | Keyword | Quote | string | number | boolean | null;

/**
 * A cons cell.
 */
export type Cell = {
  car: Sexp;
  cdr: Sexp;
};

/**
 * An atom in an S-expression.
 */
export type Atom = {
  atom: string;
};

/**
 * A keyword in an S-expression.
 */
export type Keyword = {
  keyword: string;
};

/**
 * A quoted S-expression.
 */
export type Quote = {
  quote: Sexp;
};

/**
 * Check if a value is a cons cell.
 */
export function isCell(x: any): x is Cell {
  return x instanceof Object && "car" in x && "cdr" in x;
}

/**
 * Check if a value is an atom.
 */
export function isAtom(x: any): x is Atom {
  return x instanceof Object && "atom" in x;
}

/**
 * Check if a value is a keyword.
 */
export function isKeyword(x: any): x is Keyword {
  return x instanceof Object && "keyword" in x;
}

/**
 * Check if a value is a quoted S-expression.
 */
export function isQuote(x: any): x is Quote {
  return x instanceof Object && "quote" in x;
}

/**
 * Check if a value is a valid value in an S-expression.
 */
export function isValue(x: any): x is Value {
  return (
    isAtom(x) ||
    isKeyword(x) ||
    isQuote(x) ||
    isString(x) ||
    isNumber(x) ||
    isBoolean(x) ||
    isNil(x)
  );
}

/**
 * Check if a value is a nil value
 */
export function isNil(x: any): x is null {
  return x === null;
}

/**
 * Check if a value is a list.
 *
 * Note that improper lists are also considered lists.
 */
export function isList(x: any): x is Cell {
  return isCell(x) || isNil(x);
}

/**
 * Check if a value is a string.
 */
export function isString(x: any): x is string {
  return typeof x === "string";
}

/**
 * Check if a value is a number.
 */
export function isNumber(x: any): x is number {
  return typeof x === "number";
}

/**
 * Check if a value is a boolean.
 */
export function isBoolean(x: any): x is boolean {
  return typeof x === "boolean";
}

/**
 * Create a cons cell.
 */
export function cons(car: Sexp, cdr: Sexp): Cell {
  return { car, cdr };
}

/**
 * Create a quoted S-expression.
 */
export function quote(sexp: Sexp): Quote | Keyword {
  if (isKeyword(sexp)) {
    // A quoted keyword is still a keyword.
    return k`${sexp.keyword}`;
  } else {
    // For the rest, just quote the S-expression.
    return { quote: sexp };
  }
}

/**
 * Create a list from a sequence of S-expressions.
 */
export function list(...args: Sexp[]): Sexp {
  if (args.length === 0) {
    return null;
  }

  const [car, ...rest] = args;
  return cons(car, list(...rest));
}

/**
 * Create an atom from a tagged template string.
 */
export function a(raw: TemplateStringsArray, ...substitutions: any[]): Atom {
  return { atom: String.raw({ raw }, ...substitutions) };
}

/**
 * Create a keyword from a tagged template string.
 */
export function k(raw: TemplateStringsArray, ...substitutions: any[]): Keyword {
  return { keyword: String.raw({ raw }, ...substitutions) };
}

/**
 * Convert an S-expression to a string.
 */
export function stringify(sexp: Sexp): string {
  // Dispatch based on the type of the expression.
  switch (true) {
    case isCell(sexp):
      return `(${stringifyList(sexp)})`;
    case isNil(sexp):
      return "nil";
    case isString(sexp):
      return `"${sexp}"`;
    case isNumber(sexp):
      return sexp.toString();
    case isBoolean(sexp):
      return sexp ? "t" : "nil";
    case isAtom(sexp):
      return sexp.atom;
    case isKeyword(sexp):
      return `:${sexp.keyword}`;
    case isQuote(sexp):
      return `'${stringify(sexp.quote)}`;
    default:
      throw new TypeError(`Unknown type of S-expression: ${typeof sexp}`);
  }
}

/**
 * Convert a list to a string.
 */
function stringifyList(list: Cell): string {
  // Stringify the car of the list.
  let result = "";
  if (isCell(list.car)) {
    result += `(${stringifyList(list.car)})`;
  } else {
    result += stringify(list.car);
  }

  // There are three cases for a cdr:
  // 1. cdr is another cell -> recursively stringify the cdr
  // 2. cdr is nil -> end of the list, so just return the result
  // 3. cdr is something else -> add a dot and the stringified cdr
  if (isCell(list.cdr)) {
    result += ` ${stringifyList(list.cdr)}`;
  } else if (isNil(list.cdr)) {
    return result;
  } else {
    result += ` . ${stringify(list.cdr)}`;
  }

  return result;
}

/**
 * The name of the Emacs socket to use for performing conversion.
 */
const EMACS_SOCKET_NAME = "svelte-preprocess-org";

/**
 * The instance of the Emacs daemon.
 */
let instance: ChildProcessWithoutNullStreams | null = null;

/**
 * Start the Emacs daemon to use when evaluating S-expressions.
 */
export const startup = () =>
  new Promise<void>((resolve, reject) => {
    if (instance && instance.exitCode === null) {
      // If an instance is already running, resolve immediately.
      return resolve();
    }

    // Create a temporary directory where this Emacs instance will use as its
    // user-emacs-directory.
    mkdtemp(join(tmpdir(), "svelte-preprocess-org-"), (err, dir) => {
      if (err) {
        return reject(err);
      }

      instance = spawn("emacs", [
        `--fg-daemon=${EMACS_SOCKET_NAME}`,
        `--init-directory=${dir}`,
      ])
        .on("error", (e) => {
          reject(e);
        })
        .on("exit", (code) => {
          if (code !== null && code !== 0) {
            reject(new Error(`Emacs daemon exited with code ${code}`));
          }
        })
        .on("close", () => {
          instance = null;
        });

      // Listen for stderr data to check when the Emacs instance is ready.
      instance.stderr.on("data", (data) => {
        if (data.toString().includes("Starting Emacs daemon.")) {
          resolve();
        }
      });
    });
  });

/**
 * Evaluate the given S-expression in a new instance of Emacs.
 */
export const evaluate = (sexp: Sexp, input?: string) =>
  new Promise<string>((resolve, reject) => {
    if (!instance) {
      return reject(
        new Error("Emacs instance is not started. Call start() first."),
      );
    }

    // String to save the result.
    let result = "";

    const child = spawn("emacsclient", [
      `--socket-name=${EMACS_SOCKET_NAME}`,
      "--eval",
      stringify(sexp),
    ])
      .on("close", (_) => resolve(result))
      .on("error", (e) => reject(e));

    // If there is input, redirect it to child's stdin.
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    // Child's stdout must be appended to the result.
    child.stdout.on("data", (data) => {
      result += data.toString();
    });

    // Child's stderr must be notified to the user.
    child.stderr.on("data", (data) => {
      console.error("Emacs Lisp evaluation error:", data.toString());
    });
  });

/**
 * Stop the dedicated Emacs daemon.
 */
export const shutdown = () =>
  new Promise<void>((resolve, reject) => {
    if (!instance || instance.exitCode !== null) {
      return resolve();
    }
  });
