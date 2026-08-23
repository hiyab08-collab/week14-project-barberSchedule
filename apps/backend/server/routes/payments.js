import express from "express";

import {
  createCheckoutSession,
  createAppointmentPaymentSession,
  verifySession,
} from "../controllers/paymentController.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// =========================
// NEW PREPAID BOOKING
// =========================

router.post("/create-checkout-session", requireAuth, createCheckoutSession);

// =========================
// PAY FOR EXISTING APPOINTMENT
// =========================

router.post(
  "/appointment/:id/create-checkout-session",
  requireAuth,
  createAppointmentPaymentSession,
);

// =========================
// VERIFY STRIPE SESSION
// =========================

router.get("/verify-session", requireAuth, verifySession);

export default router;
