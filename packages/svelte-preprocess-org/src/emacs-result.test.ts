import { describe, it, expect } from "vitest";

import { unwrapLispString, parseEmacsClientResult } from "./emacs-result";

describe("unwrapLispString", () => {
  it("unwraps a plain string", () => {
    expect(unwrapLispString('"hello"')).toBe("hello");
  });

  it("unescapes backslashes and double quotes", () => {
    expect(unwrapLispString('"a\\"b\\\\c"')).toBe('a"b\\c');
  });

  it("trims surrounding whitespace before unwrapping", () => {
    expect(unwrapLispString('  "hello"\n')).toBe("hello");
  });

  it("throws if the input isn't a quoted Lisp string", () => {
    expect(() => unwrapLispString("nil")).toThrow();
  });
});

describe("parseEmacsClientResult", () => {
  it("round-trips a simple result", () => {
    const printed = JSON.stringify(JSON.stringify({ result: "hello" }));
    expect(parseEmacsClientResult(printed)).toBe("hello");
  });

  it("round-trips embedded newlines, quotes, and backslashes", () => {
    const original = 'has "quotes" and \\backslashes\\ and\nnewlines';
    const printed = JSON.stringify(JSON.stringify({ result: original }));
    expect(parseEmacsClientResult(printed)).toBe(original);
  });
});
