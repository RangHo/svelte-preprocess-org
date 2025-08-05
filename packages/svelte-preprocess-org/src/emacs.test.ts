import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cons, list, stringify } from "./emacs";

test("Emacs Lisp DSL", async (t) => {
  await t.test("creates correct list", () => {
    const listA = list(`a`, `b`, `c`);
    const listB = cons(`a`, cons(`b`, cons(`c`, null)));

    assert.deepEqual(listA, listB);
  });
});
