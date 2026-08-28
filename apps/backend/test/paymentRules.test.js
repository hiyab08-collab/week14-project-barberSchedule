import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageAppointmentPayment,
  buildCardPaymentData,
  shouldRefundAppointment,
  validateManualPayment,
} from "../server/utils/paymentRules.js";

test("customer, assigned barber, and admin can manage a payment", () => {
  const appointment = { customerId: 1, barberId: 2 };

  assert.equal(
    canManageAppointmentPayment({ userId: 1, role: "CUSTOMER" }, appointment),
    true,
  );
  assert.equal(
    canManageAppointmentPayment({ userId: 2, role: "BARBER" }, appointment),
    true,
  );
  assert.equal(
    canManageAppointmentPayment({ userId: 9, role: "ADMIN" }, appointment),
    true,
  );
  assert.equal(
    canManageAppointmentPayment({ userId: 3, role: "CUSTOMER" }, appointment),
    false,
  );
});

test("cash is accepted without a note", () => {
  assert.deepEqual(validateManualPayment("CASH", ""), { note: null });
});

test("card cannot be recorded manually", () => {
  assert.match(validateManualPayment("CARD", "").error, /Stripe Checkout/);
});

test("other requires and trims a payment note", () => {
  assert.match(validateManualPayment("OTHER", "").error, /required/);
  assert.deepEqual(validateManualPayment("OTHER", "  Venmo  "), {
    note: "Venmo",
  });
});

test("Stripe confirmation records card details and keeps the first paid time", () => {
  const firstPaidAt = new Date("2026-08-27T19:44:00Z");
  const data = buildCardPaymentData(
    { paidAt: firstPaidAt },
    "pi_test_123",
    new Date("2026-08-28T00:00:00Z"),
  );

  assert.equal(data.paymentMethod, "CARD");
  assert.equal(data.stripePaymentIntentId, "pi_test_123");
  assert.equal(data.paidAt, firstPaidAt);
  assert.equal(data.paid, true);
});

test("only paid Stripe appointments qualify for automatic refunds", () => {
  assert.equal(
    shouldRefundAppointment({
      paid: true,
      stripePaymentIntentId: "pi_test_123",
      refunded: false,
    }),
    true,
  );
  assert.equal(
    shouldRefundAppointment({ paid: true, stripePaymentIntentId: null }),
    false,
  );
});
