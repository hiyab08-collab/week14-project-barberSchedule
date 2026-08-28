import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../server/middleware/auth.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("requireAdmin allows admins", () => {
  let called = false;
  requireAdmin({ user: { role: "ADMIN" } }, responseRecorder(), () => {
    called = true;
  });
  assert.equal(called, true);
});

test("requireAdmin rejects non-admin users", () => {
  const response = responseRecorder();
  requireAdmin({ user: { role: "CUSTOMER" } }, response, () => {});
  assert.equal(response.statusCode, 403);
  assert.match(response.payload.error, /Admin/);
});
