import express from "express";
import {
  toggleFavoriteBarber,
  toggleFavoriteService,
  getMyFavorites,
} from "../controllers/favoriteController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", requireAuth, getMyFavorites);
router.post("/barber/:id", requireAuth, toggleFavoriteBarber);
router.post("/service/:id", requireAuth, toggleFavoriteService);

export default router;
