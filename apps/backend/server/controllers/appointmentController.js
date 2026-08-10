import prisma from "../db/prisma.js";
import {
  sendAppointmentEmail,
  buildBookingConfirmationEmail,
  buildCancellationEmail,
} from "../config/email.js";

export async function getAllAppointments(req, res) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true, email: true } },
        service: true,
      },
      orderBy: { startTime: "asc" },
    });
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const { userId } = req.user;

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [{ customerId: userId }, { barberId: userId }],
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true, email: true } },
        service: true,
      },
      orderBy: { startTime: "asc" },
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching your appointments:", error);
    res.status(500).json({ error: "Failed to fetch your appointments" });
  }
}

export async function getAppointmentById(req, res) {
  try {
    const appointmentId = Number(req.params.id);
    const { userId, role } = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const isOwner =
      appointment.customerId === userId || appointment.barberId === userId;
    if (!isOwner && role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "You are not allowed to view this appointment" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
}

export async function createAppointmentRecord({
  customerId,
  barberId,
  serviceId,
  startTime,
}) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service) {
    throw new Error("Service not found");
  }

  const requestedStart = new Date(startTime);
  const requestedEnd = new Date(
    requestedStart.getTime() + service.durationMinutes * 60000,
  );

  const barberAppointments = await prisma.appointment.findMany({
    where: {
      barberId,
      status: { not: "CANCELLED" },
    },
    include: { service: true },
  });

  const hasConflict = barberAppointments.some((appt) => {
    const apptEnd = new Date(
      appt.startTime.getTime() + appt.service.durationMinutes * 60000,
    );
    return appt.startTime < requestedEnd && apptEnd > requestedStart;
  });

  if (hasConflict) {
    throw new Error("This barber is already booked during that time");
  }

  const appointment = await prisma.appointment.create({
    data: { customerId, barberId, serviceId, startTime: requestedStart },
    include: {
      customer: { select: { id: true, name: true, email: true, role: true } },
      barber: { select: { id: true, name: true, email: true, role: true } },
      service: true,
    },
  });

  const customerEmail = buildBookingConfirmationEmail({
    recipientName: appointment.customer.name,
    otherPersonName: appointment.barber.name,
    serviceName: appointment.service.name,
    startTime: appointment.startTime,
    role: "customer",
  });
  const barberEmail = buildBookingConfirmationEmail({
    recipientName: appointment.barber.name,
    otherPersonName: appointment.customer.name,
    serviceName: appointment.service.name,
    startTime: appointment.startTime,
    role: "barber",
  });

  await sendAppointmentEmail({
    to: appointment.customer.email,
    ...customerEmail,
  });
  await sendAppointmentEmail({
    to: appointment.barber.email,
    ...barberEmail,
  });

  return appointment;
}

export async function createAppointment(req, res) {
  try {
    const { customerId, barberId, serviceId, startTime } = req.body;

    if (!customerId || !barberId || !serviceId || !startTime) {
      return res.status(400).json({
        error: "customerId, barberId, serviceId, and startTime are required",
      });
    }

    const appointment = await createAppointmentRecord({
      customerId,
      barberId,
      serviceId,
      startTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    if (error.message === "Service not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "This barber is already booked during that time") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create appointment" });
  }
}

export async function cancelAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);
    const { userId } = req.user;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const isOwner =
      appointment.customerId === userId || appointment.barberId === userId;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not allowed to cancel this appointment" });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    const customerEmail = buildCancellationEmail({
      recipientName: updated.customer.name,
      otherPersonName: updated.barber.name,
      serviceName: updated.service.name,
      startTime: updated.startTime,
      role: "customer",
    });
    const barberEmail = buildCancellationEmail({
      recipientName: updated.barber.name,
      otherPersonName: updated.customer.name,
      serviceName: updated.service.name,
      startTime: updated.startTime,
      role: "barber",
    });

    await sendAppointmentEmail({
      to: updated.customer.email,
      ...customerEmail,
    });
    await sendAppointmentEmail({ to: updated.barber.email, ...barberEmail });

    res.json(updated);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
}

export async function updateAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);
    const { barberId, serviceId, startTime, status } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(barberId ? { barberId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const appointmentId = Number(req.params.id);

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
}
