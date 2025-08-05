import { strict as assert } from "node:assert";
import { test } from "node:test";

import { a, k, cons, quote, list, stringify } from "./emacs";

test("Emacs Lisp S-expression DSL", async (t) => {
  await t.test("creates correct list", () => {
    const listA = list(`a`, `b`, `c`);
    const listB = cons(`a`, cons(`b`, cons(`c`, null)));

    assert.deepEqual(listA, listB);
  });

  await t.test("stringifies null as nil", () => {
    assert.equal(stringify(null), "nil");
  });

  await t.test("stringifies boolean correctly", () => {
    assert.equal(stringify(true), "t");
    assert.equal(stringify(false), "nil");
  });

  await t.test("stringifies atom correctly", () => {
    assert.equal(stringify(a`a`), "a");
  });

  await t.test("stringifies keyword correctly", () => {
    assert.equal(stringify(k`a`), ":a");
  });

  await t.test("stringifies cons cell correctly", () => {
    assert.equal(stringify(cons(`a`, `b`)), '("a" . "b")');
  });

  await t.test("stringifies list correctly", () => {
    assert.equal(stringify(list(`a`, `b`, `c`)), '("a" "b" "c")');
  });

  await t.test("stringifies list with trailing cons cell correctly", () => {
    assert.equal(stringify(cons(`a`, cons(`b`, `c`))), '("a" "b" . "c")');
  });

  await t.test("stringifies list with nested lists correctly", () => {
    assert.equal(
      stringify(list(`a`, list(`b`, `c`, `d`), `e`)),
      '("a" ("b" "c" "d") "e")',
    );
  });

  await t.test("stringifies quoted atom correctly", () => {
    assert.equal(stringify(quote(a`a`)), `'a`);
  });

  await t.test("stringifies quoted keyword correctly", () => {
    assert.equal(stringify(quote(k`a`)), ":a");
  });

  await t.test("stringifies quoted list correctly", () => {
    assert.equal(stringify(quote(list(`a`, `b`, `c`))), `'("a" "b" "c")`);
  });
});
