import { Atom, Quote, cons, list, stringify } from "../src/sexp.js";

describe("S-expression module", () => {
  test("creates correct list", () => {
    const listA = list("a", "b", "c");
    const listB = cons("a", cons("b", cons("c", null)));

    expect(listA).toEqual(listB);
  });

  test("stringifies null as nil", () => {
    expect(stringify(null)).toBe("nil");
  });

  test("stringifies boolean correctly", () => {
    expect(stringify(true)).toBe("t");
    expect(stringify(false)).toBe("nil");
  });

  test("stringifies a cons cell correctly", () => {
    expect(stringify(cons("a", "b"))).toBe('("a" . "b")');
  });

  test("stringifies a list correctly", () => {
    expect(stringify(list("a", "b", "c"))).toBe('("a" "b" "c")');
  });

  test("stringifies a list with trailing cons cell correctly", () => {
    expect(stringify(cons("a", cons("b", "c")))).toBe('("a" "b" . "c")');
  });

  test("stringifies a list with nested lists correctly", () => {
    expect(stringify(list("a", list("b", "c", "d"), "e"))).toBe(
      '("a" ("b" "c" "d") "e")',
    );
  });

  test("stringifies a quoted atom correctly", () => {
    expect(stringify(new Quote(new Atom("a")))).toBe("'a");
  });

  test("stringifies a quoted list correctly", () => {
    expect(stringify(new Quote(list("a", "b", "c")))).toBe('\'("a" "b" "c")');
  });
});
