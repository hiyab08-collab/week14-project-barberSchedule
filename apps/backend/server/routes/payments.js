import express from "express";
import {
  createCheckoutSession,
  createAppointmentPaymentSession,
  verifySession,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-checkout-session", requireAuth, createCheckoutSession);
router.post(
  "/appointment/:id/create-checkout-session",
  requireAuth,
  createAppointmentPaymentSession,
);
router.get("/verify-session", requireAuth, verifySession);

export default router;
