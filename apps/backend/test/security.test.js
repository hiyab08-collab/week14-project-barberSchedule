import test from "node:test";
import assert from "node:assert/strict";
import { corsOptions, securityHeaders } from "../server/middleware/security.js";

test("CORS accepts the configured frontend and rejects unknown origins", async () => {
  const previous = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "https://example.test";
  const origin = corsOptions().origin;

  await new Promise((resolve, reject) => {
    origin("https://example.test", (error, allowed) => {
      if (error) return reject(error);
      assert.equal(allowed, true);
      resolve();
    });
  });

  await new Promise((resolve) => {
    origin("https://untrusted.test", (error) => {
      assert.match(error.message, /not allowed/);
      resolve();
    });
  });

  if (previous === undefined) {
    delete process.env.ALLOWED_ORIGINS;
  } else {
    process.env.ALLOWED_ORIGINS = previous;
  }
});

test("security headers set browser protections", () => {
  const headers = {};
  let called = false;
  securityHeaders(
    {},
    { setHeader: (name, value) => (headers[name] = value) },
    () => (called = true),
  );

  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(called, true);
});
