import express from "express";
import { signup, login, updateProfile } from "../controllers/authController.js";
import { authRateLimit } from "../middleware/security.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", authRateLimit, signup);
router.post("/login", authRateLimit, login);
router.patch("/profile", requireAuth, updateProfile);

export default router;
