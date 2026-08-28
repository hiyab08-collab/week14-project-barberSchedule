import express from "express";
import { runAppointmentReminders } from "../controllers/reminderController.js";
const router = express.Router();
router.post("/run", runAppointmentReminders);
export default router;
