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
export class Atom {
  constructor(public name: string) {}
}

/**
 * A quoted S-expression.
 */
export class Quote {
  constructor(public sexp: Sexp) {}
}

/**
 * Check if a value is a cons cell.
 */
function isCell(x: any): x is Cell {
  return x instanceof Object && "car" in x && "cdr" in x;
}

/**
 * Check if a value is a valid value in an S-expression.
 */
function isValue(x: any): x is Value {
  return (
    x instanceof Atom ||
    x instanceof Quote ||
    typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "boolean" ||
    x === null
  );
}

/**
 * Check if a value is a nil value
 */
function isNil(x: any): x is null {
  return x === null;
}

/**
 * Check if a value is a list.
 *
 * Note that improper lists are also considered lists.
 */
function isList(x: any): x is Cell {
  return isCell(x) || isNil(x);
}

/**
 * Check if a value is a string.
 */
function isString(x: any): x is string {
  return typeof x === "string";
}

/**
 * Check if a value is a number.
 */
function isNumber(x: any): x is number {
  return typeof x === "number";
}

/**
 * Check if a value is a boolean.
 */
function isBoolean(x: any): x is boolean {
  return typeof x === "boolean";
}

/**
  * Create a cons cell.
 */
export function cons(car: Sexp, cdr: Sexp): Cell {
  return {
    car,
    cdr,
  };
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
 * Convert an S-expression to a string.
 */
export function stringify(sexp: Sexp): string {
  // Dispatch based on the type of the expression.
  if (isCell(sexp)) {
    return `(${stringifyList(sexp)})`;
  } else if (isNil(sexp)) {
    return "nil";
  } else if (isString(sexp)) {
    return `"${sexp}"`;
  } else if (isNumber(sexp)) {
    return sexp.toString();
  } else if (isBoolean(sexp)) {
    return sexp ? "t" : "nil";
  } else if (sexp instanceof Atom) {
    return sexp.name;
  } else if (sexp instanceof Quote) {
    return `'${stringify(sexp.sexp)}`;
  } else {
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
