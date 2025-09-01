import { describe, it, expect, vi } from "vitest";

import { a, k, cons, quote, list, stringify } from "./emacs.js";

describe.concurrent("Emacs Lisp S-expression DSL", async () => {
  it("creates correct list", () => {
    const listA = list(`a`, `b`, `c`);
    const listB = cons(`a`, cons(`b`, cons(`c`, null)));

    expect(listA).toEqual(listB);
  });

  it("stringifies null as nil", () => {
    expect(stringify(null)).toBe("nil");
  });

  it("stringifies boolean", () => {
    expect(stringify(true)).toBe("t");
    expect(stringify(false)).toBe("nil");
  });

  it("stringifies atom", () => {
    expect(stringify(a`a`)).toBe("a");
  });

  it("stringifies keyword", () => {
    expect(stringify(k`a`)).toBe(":a");
  });

  it("stringifies cons cell", () => {
    expect(stringify(cons(`a`, `b`))).toBe('("a" . "b")');
  });

  it("stringifies list", () => {
    expect(stringify(list(`a`, `b`, `c`))).toBe('("a" "b" "c")');
  });

  it("stringifies list with trailing cons cell", () => {
    expect(stringify(cons(`a`, cons(`b`, `c`)))).toBe('("a" "b" . "c")');
  });

  it("stringifies list with nested lists", () => {
    expect(stringify(list(`a`, list(`b`, `c`, `d`), `e`))).toBe(
      '("a" ("b" "c" "d") "e")',
    );
  });

  it("stringifies quoted atom", () => {
    expect(stringify(quote(a`a`))).toBe(`'a`);
  });

  it("stringifies quoted keyword", () => {
    expect(stringify(quote(k`a`))).toBe(":a");
  });

  it("stringifies quoted list", () => {
    expect(stringify(quote(list(`a`, `b`, `c`)))).toBe(`'("a" "b" "c")`);
  });
});
