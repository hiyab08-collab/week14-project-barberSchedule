import prisma from "../db/prisma.js";
import { buildReminderEmail, sendAppointmentEmail } from "../config/email.js";

export async function runAppointmentReminders(req, res) {
  if (!process.env.REMINDER_JOB_SECRET || req.headers["x-reminder-secret"] !== process.env.REMINDER_JOB_SECRET) {
    return res.status(401).json({ error: "Invalid reminder job secret" });
  }

  const now = new Date();
  const from = now;
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const appointments = await prisma.appointment.findMany({
    where: { startTime: { gte: from, lte: to }, reminderSentAt: null, status: { in: ["PENDING", "CONFIRMED"] } },
    include: { customer: true, barber: true, service: true },
  });

  for (const appointment of appointments) {
    if (appointment.customer.email) await sendAppointmentEmail({
      to: appointment.customer.email,
      ...buildReminderEmail({ recipientName: appointment.customer.name, otherPersonName: appointment.barber.name, serviceName: appointment.service.name, startTime: appointment.startTime, role: "customer" }),
    });
    if (appointment.barber.email) await sendAppointmentEmail({
      to: appointment.barber.email,
      ...buildReminderEmail({ recipientName: appointment.barber.name, otherPersonName: appointment.customer.name, serviceName: appointment.service.name, startTime: appointment.startTime, role: "barber" }),
    });
    await prisma.appointment.update({ where: { id: appointment.id }, data: { reminderSentAt: new Date() } });
  }

  return res.json({ processed: appointments.length });
}
