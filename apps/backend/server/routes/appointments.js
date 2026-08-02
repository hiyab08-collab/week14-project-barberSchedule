import express from "express";
import {
  getAllAppointments,
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getAllAppointments);
router.get("/mine", requireAuth, getMyAppointments);
router.get("/:id", requireAuth, getAppointmentById);
router.post("/", requireAuth, createAppointment);
router.patch("/:id/cancel", requireAuth, cancelAppointment);
router.patch("/:id", requireAuth, requireAdmin, updateAppointment);
router.delete("/:id", requireAuth, requireAdmin, deleteAppointment);

export default router;
