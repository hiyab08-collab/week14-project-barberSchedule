import Stripe from "stripe";
import prisma from "../db/prisma.js";

import {
  sendAppointmentEmail,
  buildBookingConfirmationEmail,
  buildCancellationEmail,
} from "../config/email.js";
import {
  shouldRefundAppointment,
  validateManualPayment,
} from "../utils/paymentRules.js";
import { appointmentsOverlap } from "../utils/appointmentRules.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// =========================
// GET ALL APPOINTMENTS
// =========================

export async function getAllAppointments(req, res) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

      orderBy: {
        startTime: "asc",
      },
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);

    res.status(500).json({
      error: "Failed to fetch appointments",
    });
  }
}

// =========================
// GET MY APPOINTMENTS
// =========================

export async function getMyAppointments(req, res) {
  try {
    const { userId } = req.user;

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          {
            customerId: userId,
          },

          {
            barberId: userId,
          },
        ],
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

      orderBy: {
        startTime: "asc",
      },
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching your appointments:", error);

    res.status(500).json({
      error: "Failed to fetch your appointments",
    });
  }
}

// =========================
// GET APPOINTMENT BY ID
// =========================

export async function getAppointmentById(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const { userId, role } = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    const isOwner =
      appointment.customerId === userId || appointment.barberId === userId;

    if (!isOwner && role !== "ADMIN") {
      return res.status(403).json({
        error: "You are not allowed to view this appointment",
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);

    res.status(500).json({
      error: "Failed to fetch appointment",
    });
  }
}

// =========================
// CREATE APPOINTMENT RECORD
// =========================

export async function createAppointmentRecord({
  customerId,
  barberId,
  serviceId,
  startTime,
}) {
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  const requestedStart = new Date(startTime);

  const barberAppointments = await prisma.appointment.findMany({
    where: {
      barberId,

      status: {
        not: "CANCELLED",
      },
    },

    include: {
      service: true,
    },
  });

  const hasConflict = barberAppointments.some((appt) => {
    return appointmentsOverlap(
      requestedStart,
      service.durationMinutes,
      appt.startTime,
      appt.service.durationMinutes,
    );
  });

  if (hasConflict) {
    throw new Error("This barber is already booked during that time");
  }

  const appointment = await prisma.appointment.create({
    data: {
      customerId,
      barberId,
      serviceId,
      startTime: requestedStart,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },

      barber: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      service: true,
    },
  });

  // =========================
  // BOOKING EMAILS
  // =========================

  if (appointment.customer.email) {
    const customerEmail = buildBookingConfirmationEmail({
      recipientName: appointment.customer.name,

      otherPersonName: appointment.barber.name,

      serviceName: appointment.service.name,

      startTime: appointment.startTime,

      role: "customer",
    });

    await sendAppointmentEmail({
      to: appointment.customer.email,

      ...customerEmail,
    });
  }

  if (appointment.barber.email) {
    const barberEmail = buildBookingConfirmationEmail({
      recipientName: appointment.barber.name,

      otherPersonName: appointment.customer.name,

      serviceName: appointment.service.name,

      startTime: appointment.startTime,

      role: "barber",
    });

    await sendAppointmentEmail({
      to: appointment.barber.email,

      ...barberEmail,
    });
  }

  return appointment;
}

// =========================
// CREATE APPOINTMENT
// =========================

export async function createAppointment(req, res) {
  try {
    const { customerId, barberId, serviceId, startTime } = req.body;

    const { userId, role } = req.user;

    if (!serviceId || !startTime) {
      return res.status(400).json({
        error: "serviceId and startTime are required",
      });
    }

    let finalCustomerId;
    let finalBarberId;

    // =========================
    // CUSTOMER BOOKING
    // =========================

    if (role === "CUSTOMER") {
      if (!barberId) {
        return res.status(400).json({
          error: "barberId is required",
        });
      }

      // Customers can only book
      // appointments for themselves.
      finalCustomerId = userId;
      finalBarberId = Number(barberId);
    }

    // =========================
    // BARBER PHONE BOOKING
    // =========================
    else if (role === "BARBER") {
      if (!customerId) {
        return res.status(400).json({
          error: "customerId is required",
        });
      }

      // Barber selects the customer,
      // but barber is always themselves.
      finalCustomerId = Number(customerId);

      finalBarberId = userId;
    }

    // =========================
    // ADMIN BOOKING
    // =========================
    else if (role === "ADMIN") {
      if (!customerId || !barberId) {
        return res.status(400).json({
          error: "customerId and barberId are required",
        });
      }

      finalCustomerId = Number(customerId);

      finalBarberId = Number(barberId);
    } else {
      return res.status(403).json({
        error: "You are not allowed to create appointments",
      });
    }

    // =========================
    // VERIFY CUSTOMER
    // =========================

    const customerAccount = await prisma.user.findUnique({
      where: {
        id: finalCustomerId,
      },
    });

    if (!customerAccount || customerAccount.role !== "CUSTOMER") {
      return res.status(400).json({
        error: "A valid customer is required",
      });
    }

    // =========================
    // VERIFY BARBER
    // =========================

    const barberAccount = await prisma.user.findUnique({
      where: {
        id: finalBarberId,
      },
    });

    if (!barberAccount || barberAccount.role !== "BARBER") {
      return res.status(400).json({
        error: "A valid barber is required",
      });
    }

    // =========================
    // CREATE
    // =========================

    const appointment = await createAppointmentRecord({
      customerId: finalCustomerId,

      barberId: finalBarberId,

      serviceId: Number(serviceId),

      startTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);

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
      error: "Failed to create appointment",
    });
  }
}

// =========================
// CANCEL APPOINTMENT
// + REFUND IF PREPAID
// =========================

export async function cancelAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const { userId } = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    const isOwner =
      appointment.customerId === userId || appointment.barberId === userId;

    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "You are not allowed to cancel this appointment",
      });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({
        error: "This appointment is already cancelled",
      });
    }

    // Completed services cannot
    // be cancelled or refunded.
    if (appointment.status === "COMPLETED") {
      return res.status(400).json({
        error: "A completed appointment cannot be cancelled",
      });
    }

    let refunded = false;

    // =========================
    // REFUND PREPAID PAYMENT
    // =========================

    if (shouldRefundAppointment(appointment)) {
      await stripe.refunds.create(
        {
          payment_intent: appointment.stripePaymentIntentId,
        },
        {
          idempotencyKey: `appointment-refund-${appointmentId}`,
        },
      );

      refunded = true;
    }

    // Older prepaid appointments that
    // do not have Stripe payment info
    // should not silently cancel.
    if (
      appointment.paid &&
      !appointment.stripePaymentIntentId &&
      !appointment.refunded
    ) {
      return res.status(409).json({
        error:
          "This paid appointment does not have Stripe payment information and cannot be automatically refunded.",
      });
    }

    const updated = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },

      data: {
        status: "CANCELLED",

        ...(refunded
          ? {
              paid: false,
              refunded: true,
              refundedAt: new Date(),
            }
          : {}),
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    // =========================
    // CANCELLATION EMAILS
    // =========================

    if (updated.customer.email) {
      const customerEmail = buildCancellationEmail({
        recipientName: updated.customer.name,

        otherPersonName: updated.barber.name,

        serviceName: updated.service.name,

        startTime: updated.startTime,

        role: "customer",
      });

      await sendAppointmentEmail({
        to: updated.customer.email,

        ...customerEmail,
      });
    }

    if (updated.barber.email) {
      const barberEmail = buildCancellationEmail({
        recipientName: updated.barber.name,

        otherPersonName: updated.customer.name,

        serviceName: updated.service.name,

        startTime: updated.startTime,

        role: "barber",
      });

      await sendAppointmentEmail({
        to: updated.barber.email,

        ...barberEmail,
      });
    }

    res.json({
      ...updated,

      refundIssued: refunded,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);

    // Do not mark the appointment
    // cancelled if Stripe refund fails.
    if (error?.type?.startsWith("Stripe") || error?.raw?.type) {
      return res.status(502).json({
        error:
          "The appointment could not be cancelled because the Stripe refund failed.",
      });
    }

    res.status(500).json({
      error: "Failed to cancel appointment",
    });
  }
}

// =========================
// BARBER MARK COMPLETED
// =========================

export async function markAppointmentCompleted(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const { userId, role } = req.user;

    if (role !== "BARBER") {
      return res.status(403).json({
        error: "Only a barber can mark an appointment as completed",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    if (appointment.barberId !== userId) {
      return res.status(403).json({
        error: "You can only complete your own appointments",
      });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({
        error: "A cancelled appointment cannot be completed",
      });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({
        error: "This appointment is already completed",
      });
    }

    const updated = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },

      data: {
        status: "COMPLETED",
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    res.json(updated);
  } catch (error) {
    console.error("Error completing appointment:", error);

    res.status(500).json({
      error: "Failed to complete appointment",
    });
  }
}

// =========================
// BARBER RECORD PAYMENT
// =========================

export async function recordAppointmentPayment(req, res) {
  try {
    const appointmentId = Number(req.params.id);
    const { userId, role } = req.user;
    const { paymentMethod, paymentNote } = req.body;

    if (role !== "BARBER") {
      return res.status(403).json({
        error: "Only a barber can record an in-person payment",
      });
    }

    const paymentValidation = validateManualPayment(
      paymentMethod,
      paymentNote,
    );

    if (paymentValidation.error) {
      return res.status(400).json({ error: paymentValidation.error });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    if (appointment.barberId !== userId) {
      return res.status(403).json({
        error: "You can only record payment for your own appointments",
      });
    }

    if (appointment.status !== "COMPLETED") {
      return res.status(400).json({
        error: "The service must be completed before recording payment",
      });
    }

    if (appointment.refunded) {
      return res.status(400).json({
        error: "A refunded appointment cannot be marked paid",
      });
    }

    if (appointment.paid) {
      return res.status(400).json({
        error: "This appointment is already paid",
      });
    }

    const updated = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },

      data: {
        paid: true,
        paymentMethod,
        paymentNote: paymentValidation.note,
        paidAt: new Date(),
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    res.json(updated);
  } catch (error) {
    console.error("Error recording appointment payment:", error);

    res.status(500).json({
      error: "Failed to record payment",
    });
  }
}

// =========================
// UPDATE APPOINTMENT
// ADMIN
// =========================

export async function updateAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const { barberId, serviceId, startTime, status } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    const updated = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },

      data: {
        ...(barberId
          ? {
              barberId: Number(barberId),
            }
          : {}),

        ...(serviceId
          ? {
              serviceId: Number(serviceId),
            }
          : {}),

        ...(startTime
          ? {
              startTime: new Date(startTime),
            }
          : {}),

        ...(status
          ? {
              status,
            }
          : {}),
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    res.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);

    res.status(500).json({
      error: "Failed to update appointment",
    });
  }
}

// =========================
// DELETE APPOINTMENT
// ADMIN
// =========================

export async function deleteAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const existing = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    // Protect paid appointments from
    // being deleted without a refund.
    if (existing.paid && !existing.refunded) {
      return res.status(409).json({
        error:
          "A paid appointment must be cancelled and refunded before it can be deleted.",
      });
    }

    await prisma.appointment.delete({
      where: {
        id: appointmentId,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);

    res.status(500).json({
      error: "Failed to delete appointment",
    });
  }
}
