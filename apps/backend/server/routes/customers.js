import express from "express";

import { getCustomers } from "../controllers/customerController.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function requireBarberOrAdmin(req, res, next) {
  if (req.user.role !== "BARBER" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Only barbers and admins can access customers",
    });
  }

  next();
}

router.get("/", requireAuth, requireBarberOrAdmin, getCustomers);

export default router;
