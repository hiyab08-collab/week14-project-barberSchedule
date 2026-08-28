import Stripe from "stripe";
import prisma from "../db/prisma.js";
import { createAppointmentRecord } from "./appointmentController.js";
import {
  buildCardPaymentData,
  canManageAppointmentPayment,
} from "../utils/paymentRules.js";
import { isFutureAppointmentTime } from "../utils/appointmentRules.js";
import { buildReceiptEmail, sendAppointmentEmail } from "../config/email.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// =========================
// HELPER
// =========================

function getPaymentIntentId(session) {
  if (!session.payment_intent) {
    return null;
  }

  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent.id ?? null;
}

const appointmentInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  barber: { select: { id: true, name: true, email: true } },
  service: true,
};

async function sendReceipt(appointment) {
  if (!appointment.customer.email || appointment.receiptSentAt) return;
  await sendAppointmentEmail({
    to: appointment.customer.email,
    ...buildReceiptEmail({
      customerName: appointment.customer.name,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
      amount: appointment.service.price,
      paymentMethod: appointment.paymentMethod,
      paymentNote: appointment.paymentNote,
      cardBrand: appointment.cardBrand,
      cardLast4: appointment.cardLast4,
      paidAt: appointment.paidAt,
    }),
  });
  await prisma.appointment.update({ where: { id: appointment.id }, data: { receiptSentAt: new Date() } });
}

async function applyPaidCheckoutSession(session, actor = null) {
  if (session.payment_status !== "paid") {
    const error = new Error("Payment not completed");
    error.status = 402;
    throw error;
  }

  const paymentIntentId = getPaymentIntentId(session);

  if (!paymentIntentId) {
    const error = new Error("Stripe payment information was not returned");
    error.status = 500;
    throw error;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });
  const card = paymentIntent.payment_method?.card || {};

  if (session.metadata?.type === "existing_appointment") {
    const appointmentId = Number(session.metadata.appointmentId);
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      const error = new Error("Appointment not found");
      error.status = 404;
      throw error;
    }

    if (actor && !canManageAppointmentPayment(actor, appointment)) {
      const error = new Error("You are not allowed to verify this payment");
      error.status = 403;
      throw error;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: buildCardPaymentData(appointment, paymentIntentId, new Date(), card),
      include: appointmentInclude,
    });
    await sendReceipt(updated);
    return updated;
  }

  if (session.metadata?.type !== "new_booking") {
    const error = new Error("Unknown payment session type");
    error.status = 400;
    throw error;
  }

  const { customerId, barberId, serviceId, startTime } = session.metadata;

  if (actor && actor.role !== "ADMIN" && Number(customerId) !== actor.userId) {
    const error = new Error("You are not allowed to verify this payment");
    error.status = 403;
    throw error;
  }

  let appointment = await prisma.appointment.findFirst({
    where: {
      customerId: Number(customerId),
      barberId: Number(barberId),
      serviceId: Number(serviceId),
      startTime: new Date(startTime),
    },
  });

  if (!appointment) {
    appointment = await createAppointmentRecord({
      customerId: Number(customerId),
      barberId: Number(barberId),
      serviceId: Number(serviceId),
      startTime,
    });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
      data: buildCardPaymentData(appointment, paymentIntentId, new Date(), card),
    include: appointmentInclude,
  });
  await sendReceipt(updated);
  return updated;
}

export async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Stripe webhook is not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error.message);
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await applyPaidCheckoutSession(event.data.object);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Failed to process Stripe webhook",
    });
  }
}

// =========================
// CREATE PREPAID BOOKING
// CHECKOUT SESSION
// =========================

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
      where: {
        id: Number(serviceId),
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: service.name,
            },

            unit_amount: Math.round(Number(service.price) * 100),
          },

          quantity: 1,
        },
      ],

      metadata: {
        type: "new_booking",
        customerId: String(userId),
        barberId: String(barberId),
        serviceId: String(serviceId),
        startTime,
      },

      success_url: `${FRONTEND_URL}/?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${FRONTEND_URL}/?payment=cancelled`,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    res.status(500).json({
      error: "Failed to create checkout session",
    });
  }
}

// =========================
// CREATE PAYMENT SESSION
// FOR AN EXISTING APPOINTMENT
// =========================

export async function createAppointmentPaymentSession(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const { userId, role } = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        service: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    if (!canManageAppointmentPayment({ userId, role }, appointment)) {
      return res.status(403).json({
        error: "You are not allowed to pay for this appointment",
      });
    }

    if (appointment.status !== "COMPLETED") {
      return res.status(400).json({
        error: "This appointment is not yet marked as completed",
      });
    }

    if (appointment.paid) {
      return res.status(400).json({
        error: "This appointment is already paid",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: appointment.service.name,
            },

            unit_amount: Math.round(Number(appointment.service.price) * 100),
          },

          quantity: 1,
        },
      ],

      metadata: {
        type: "existing_appointment",

        appointmentId: String(appointmentId),
      },

      success_url: `${FRONTEND_URL}/?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${FRONTEND_URL}/?payment=cancelled`,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating appointment payment session:", error);

    res.status(500).json({
      error: "Failed to create payment session",
    });
  }
}

// =========================
// VERIFY STRIPE PAYMENT
// =========================

export async function verifySession(req, res) {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    if (!isFutureAppointmentTime(startTime)) {
      return res.status(400).json({ error: "Appointment time must be in the future" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const appointment = await applyPaidCheckoutSession(session, req.user);
    return res.json(appointment);
  } catch (error) {
    console.error("Error verifying session:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Failed to verify payment session",
    });
  }
}
