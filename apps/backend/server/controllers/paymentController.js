import Stripe from "stripe";
import prisma from "../db/prisma.js";
import { createAppointmentRecord } from "./appointmentController.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export async function createCheckoutSession(req, res) {
  try {
    const { barberId, serviceId, startTime } = req.body;
    const { userId } = req.user;

    if (!barberId || !serviceId || !startTime) {
      return res.status(400).json({
        error: "barberId, serviceId, and startTime are required",
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: service.name },
            unit_amount: Math.round(Number(service.price) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        customerId: String(userId),
        barberId: String(barberId),
        serviceId: String(serviceId),
        startTime,
      },
      success_url: `${FRONTEND_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}

export async function verifySession(req, res) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const { customerId, barberId, serviceId, startTime } = session.metadata;

    const existing = await prisma.appointment.findFirst({
      where: {
        customerId: Number(customerId),
        barberId: Number(barberId),
        serviceId: Number(serviceId),
        startTime: new Date(startTime),
      },
    });

    if (existing) {
      return res.json(existing);
    }

    const appointment = await createAppointmentRecord({
      customerId: Number(customerId),
      barberId: Number(barberId),
      serviceId: Number(serviceId),
      startTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error verifying session:", error);
    if (error.message === "Service not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "This barber is already booked during that time") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to verify payment session" });
  }
}
