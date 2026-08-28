import "dotenv/config";
import express from "express";
import cors from "cors";
import servicesRouter from "./routes/services.js";
import appointmentsRouter from "./routes/appointments.js";
import authRouter from "./routes/auth.js";
import barbersRouter from "./routes/barbers.js";
import reviewsRouter from "./routes/reviews.js";
import favoritesRouter from "./routes/favorites.js";
import paymentsRouter from "./routes/payments.js";
import customersRouter from "./routes/customers.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { corsOptions, securityHeaders } from "./middleware/security.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions()));
app.use(securityHeaders);
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/services", servicesRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/barbers", barbersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/customers", customersRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Barbershop API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
