import express from "express";
import {
  createCheckoutSession,
  verifySession,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-checkout-session", requireAuth, createCheckoutSession);
router.get("/verify-session", requireAuth, verifySession);

export default router;
