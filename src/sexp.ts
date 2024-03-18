export type Sexp = Value | Cell;

export type Value = Atom | Quote | string | number | boolean | null;

export type Cell = {
  car: Sexp;
  cdr: Sexp;
};

export class Atom {
  constructor(public name: string) {}
}

export class Quote {
  constructor(public sexp: Sexp) {}
}

function isCell(x: any): x is Cell {
  return x instanceof Object && "car" in x && "cdr" in x;
}

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

function isNil(x: any): x is null {
  return x === null;
}

function isList(x: any): x is Cell {
  return isCell(x) || isNil(x);
}

function isString(x: any): x is string {
  return typeof x === "string";
}

function isNumber(x: any): x is number {
  return typeof x === "number";
}

function isBoolean(x: any): x is boolean {
  return typeof x === "boolean";
}

export function cons(car: Sexp, cdr: Sexp): Cell {
  return {
    car,
    cdr,
  };
}

export function list(...args: Sexp[]): Sexp {
  if (args.length === 0) {
    return null;
  }

  const [car, ...rest] = args;
  return cons(car, list(...rest));
}

export function stringify(sexp: Sexp): string {
  // Dispatch based on the type of the expression
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

function stringifyList(list: Cell): string {
  // Stringify the car of the list
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
