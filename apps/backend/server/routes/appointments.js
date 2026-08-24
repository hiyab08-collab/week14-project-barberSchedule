import express from "express";

import {
  getAllAppointments,
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
  deleteAppointment,
  markAppointmentCompleted,
} from "../controllers/appointmentController.js";

import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// =========================
// ADMIN
// =========================

router.get("/", requireAuth, requireAdmin, getAllAppointments);

// =========================
// LOGGED-IN USER
// =========================

router.get("/mine", requireAuth, getMyAppointments);

// =========================
// CREATE APPOINTMENT
// =========================

router.post("/", requireAuth, createAppointment);

// =========================
// GET ONE APPOINTMENT
// =========================

router.get("/:id", requireAuth, getAppointmentById);

// =========================
// CANCEL APPOINTMENT
// =========================

router.patch("/:id/cancel", requireAuth, cancelAppointment);

// =========================
// BARBER MARK COMPLETED
// =========================

router.patch("/:id/complete", requireAuth, markAppointmentCompleted);

// =========================
// ADMIN UPDATE
// =========================

router.patch("/:id", requireAuth, requireAdmin, updateAppointment);

// =========================
// ADMIN DELETE
// =========================

router.delete("/:id", requireAuth, requireAdmin, deleteAppointment);

export default router;

export async function completeAppointment(appointmentId, token) {
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/complete`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to complete appointment");
  }

  return data;
}
