import express from "express";
import { getReviews, createReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";
import upload from "../config/upload.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", requireAuth, upload.single("media"), createReview);

export default router;
