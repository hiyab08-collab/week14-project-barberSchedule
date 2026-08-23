import Stripe from "stripe";
import prisma from "../db/prisma.js";
import { createAppointmentRecord } from "./appointmentController.js";

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

    const { userId } = req.user;

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

    if (appointment.customerId !== userId) {
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
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({
        error: "Payment not completed",
      });
    }

    const paymentIntentId = getPaymentIntentId(session);

    if (!paymentIntentId) {
      return res.status(500).json({
        error: "Stripe payment information was not returned",
      });
    }

    // =========================
    // EXISTING APPOINTMENT
    // =========================

    if (session.metadata?.type === "existing_appointment") {
      const appointmentId = Number(session.metadata.appointmentId);

      const appointment = await prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!appointment) {
        return res.status(404).json({
          error: "Appointment not found",
        });
      }

      const updated = await prisma.appointment.update({
        where: {
          id: appointmentId,
        },

        data: {
          paid: true,

          stripePaymentIntentId: paymentIntentId,

          refunded: false,
          refundedAt: null,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          barber: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          service: true,
        },
      });

      return res.json(updated);
    }

    // =========================
    // NEW PREPAID BOOKING
    // =========================

    if (session.metadata?.type !== "new_booking") {
      return res.status(400).json({
        error: "Unknown payment session type",
      });
    }

    const { customerId, barberId, serviceId, startTime } = session.metadata;

    const existing = await prisma.appointment.findFirst({
      where: {
        customerId: Number(customerId),

        barberId: Number(barberId),

        serviceId: Number(serviceId),

        startTime: new Date(startTime),
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        service: true,
      },
    });

    // If verification is called more
    // than once, keep it idempotent.
    if (existing) {
      const updatedExisting = await prisma.appointment.update({
        where: {
          id: existing.id,
        },

        data: {
          paid: true,

          stripePaymentIntentId: paymentIntentId,

          refunded: false,
          refundedAt: null,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          barber: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          service: true,
        },
      });

      return res.json(updatedExisting);
    }

    const appointment = await createAppointmentRecord({
      customerId: Number(customerId),

      barberId: Number(barberId),

      serviceId: Number(serviceId),

      startTime,
    });

    const paidAppointment = await prisma.appointment.update({
      where: {
        id: appointment.id,
      },

      data: {
        paid: true,

        stripePaymentIntentId: paymentIntentId,

        refunded: false,
        refundedAt: null,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        service: true,
      },
    });

    res.status(201).json(paidAppointment);
  } catch (error) {
    console.error("Error verifying session:", error);

    if (error.message === "Service not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === "This barber is already booked during that time") {
      return res.status(409).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to verify payment session",
    });
  }
}
