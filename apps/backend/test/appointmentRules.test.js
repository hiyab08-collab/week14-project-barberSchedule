import test from "node:test";
import assert from "node:assert/strict";
import { appointmentsOverlap } from "../server/utils/appointmentRules.js";

test("overlapping appointments are detected", () => {
  assert.equal(
    appointmentsOverlap(
      "2026-08-27T14:00:00Z",
      30,
      "2026-08-27T14:15:00Z",
      30,
    ),
    true,
  );
});

test("back-to-back appointments do not overlap", () => {
  assert.equal(
    appointmentsOverlap(
      "2026-08-27T14:00:00Z",
      30,
      "2026-08-27T14:30:00Z",
      30,
    ),
    false,
  );
});
