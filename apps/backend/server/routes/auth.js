import express from "express";
import { signup, login } from "../controllers/authController.js";
import { authRateLimit } from "../middleware/security.js";

const router = express.Router();

router.post("/signup", authRateLimit, signup);
router.post("/login", authRateLimit, login);

export default router;
