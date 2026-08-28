import test from "node:test";
import assert from "node:assert/strict";
import { appointmentsOverlap, isFutureAppointmentTime } from "../server/utils/appointmentRules.js";

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

test("past appointment times are rejected", () => {
  assert.equal(isFutureAppointmentTime("2026-08-27T10:00:00Z", new Date("2026-08-28T10:00:00Z")), false);
  assert.equal(isFutureAppointmentTime("2026-08-29T10:00:00Z", new Date("2026-08-28T10:00:00Z")), true);
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
