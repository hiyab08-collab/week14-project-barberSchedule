import express from "express";
import {
  getAllBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleLike,
} from "../controllers/barberController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllBarbers);
router.get("/:id", getBarberById);
router.post("/", requireAuth, requireAdmin, createBarber);
router.put("/:id", requireAuth, requireAdmin, updateBarber);
router.delete("/:id", requireAuth, requireAdmin, deleteBarber);
router.post("/:id/like", requireAuth, toggleLike);

export default router;
