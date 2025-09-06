import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
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
export function isCell(x: unknown): x is Cell {
  return x instanceof Object && "car" in x && "cdr" in x;
}

/**
 * Check if a value is an atom.
 */
export function isAtom(x: unknown): x is Atom {
  return x instanceof Object && "atom" in x;
}

/**
 * Check if a value is a keyword.
 */
export function isKeyword(x: unknown): x is Keyword {
  return x instanceof Object && "keyword" in x;
}

/**
 * Check if a value is a quoted S-expression.
 */
export function isQuote(x: unknown): x is Quote {
  return x instanceof Object && "quote" in x;
}

/**
 * Check if a value is a valid value in an S-expression.
 */
export function isValue(x: unknown): x is Value {
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
export function isNil(x: unknown): x is null {
  return x === null;
}

/**
 * Check if a value is a list.
 *
 * Note that improper lists are also considered lists.
 */
export function isList(x: unknown): x is Cell {
  return isCell(x) || isNil(x);
}

/**
 * Check if a value is a string.
 */
export function isString(x: unknown): x is string {
  return typeof x === "string";
}

/**
 * Check if a value is a number.
 */
export function isNumber(x: unknown): x is number {
  return typeof x === "number";
}

/**
 * Check if a value is a boolean.
 */
export function isBoolean(x: unknown): x is boolean {
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
export function a(
  raw: TemplateStringsArray,
  ...substitutions: unknown[]
): Atom {
  return { atom: String.raw({ raw }, ...substitutions) };
}

/**
 * Create a keyword from a tagged template string.
 */
export function k(
  raw: TemplateStringsArray,
  ...substitutions: unknown[]
): Keyword {
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
 * An Emacs instance for evaluating S-expressions.
 *
 * Since each Emacs instance constructetd from this class is assigned their own
 * temporary directory as their init directory, any persistent state that needs
 * to be preserved between evaluations can be stored in that directory (e.g. in
 * the .eld files).
 */
export class Emacs {
  /**
   * S-expression to evaluate when `run` method is called.
   */
  private sexps: Sexp[] = [];

  /**
   * String value to be piped into the standard input.
   */
  private stdin: string;

  /**
   * Initialize a new Emacs instance.
   *
   * Internally, this will request a temporary directory to be created, which
   * will be used as the Emacs init directory when `Emacs.run` is called.
   *
    * @param initDirectory - Directory that will be used as the `user-emacs-directory`.
   */
  constructor(private initDirectory: string) {
    this.stdin = "";
  }

  /**
   * Register the features/packages to require.
   *
   * This function will append to the previous value.
   * The `run` call will not reset this value.
   */
  require(feature: string, filename?: string) {
    this.sexps.push(
      filename
        ? list(a`require`, quote(a`${feature}`), filename)
        : list(a`require`, quote(a`${feature}`)),
    );

    return this;
  }

  /**
   * Register S-expressions to evaluate.
   *
   * This function will append to the previous value.
   * The `run` call will reset this value.
   */
  progn(...sexps: Sexp[]) {
    this.sexps.push(...sexps);

    return this;
  }

  /**
   * Register the string to be fed into the standard input.
   *
   * This function will replace the previous value.
   * The `run` call will reset this value.
   */
  minibuffer(content: string) {
    this.stdin = content;

    return this;
  }

  /**
   * Run the registered S-expressions in Emacs.
   *
   * @rehturns The standard output of the Emacs process.
   */
  run() {
    // Spawn Emacs in batch mode to evaluate the S-expressions.
    const { stdout, stderr, error } = spawnSync(
      "emacs",
      [
        `--init-directory=${this.initDirectory}`,
        "--batch",
        "--eval",
        stringify(list(a`progn`, ...this.sexps)),
      ],
      {
        input: this.stdin,
      },
    );
    if (error) {
      throw error;
    }

    // Reset the S-expressions and stdin for the next run.
    this.sexps = [];
    this.stdin = "";

    // Return the standard output.
    return stdout.toString();
  }
}
