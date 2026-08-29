import test from "node:test";
import assert from "node:assert/strict";
import { formatShopDateTime } from "../server/config/email.js";

test("email times use the New York shop time zone", () => {
  const formatted = formatShopDateTime("2026-08-30T02:00:00.000Z");
  assert.match(formatted, /Aug 29, 2026/);
  assert.match(formatted, /10:00 PM/);
});
