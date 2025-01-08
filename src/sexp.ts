/**
 * An S-expression.
 */
export type Sexp = Value | Cell;

/**
 * A value in an S-expression.
 */
export type Value = Atom | Quote | string | number | boolean | null;

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
  name: string;
};

/**
 * A quoted S-expression.
 */
export type Quote = {
  sexp: Sexp;
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
  return x instanceof Object && "name" in x;
}

/**
 * Check if a value is a quoted S-expression.
 */
export function isQuote(x: any): x is Quote {
  return x instanceof Object && "sexp" in x;
}

/**
 * Check if a value is a valid value in an S-expression.
 */
export function isValue(x: any): x is Value {
  return (
    isAtom(x) ||
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
 * Create an atom from a tagged template string.
 */
export function a(raw: TemplateStringsArray, ...substitutions: any[]): Atom {
  return { name: String.raw({ raw }, ...substitutions) };
}

/**
 * Create a quoted S-expression.
 */
export function q(sexp: Sexp): Quote {
  return { sexp };
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
 * Create a function call.
 *
 * This is a shorthand for creating a list with the function name as the car.
 */
export function call(name: string, ...args: Sexp[]): Sexp {
  return list(a`${name}`, ...args);
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
      return sexp.name;
    case isQuote(sexp):
      return `'${stringify(sexp.sexp)}`;
    default:
      throw new TypeError(`Unknown type of S-expression: ${typeof sexp}`);
  }
}

/**
 * Convert a list to a string.
 */
export function stringifyList(list: Cell): string {
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
