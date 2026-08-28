import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "SlicedBy_10 <onboarding@resend.dev>";

export async function sendAppointmentEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export function buildBookingConfirmationEmail({
  recipientName,
  otherPersonName,
  serviceName,
  startTime,
  role,
}) {
  const formattedTime = new Date(startTime).toLocaleString();
  const verb =
    role === "customer" ? `with ${otherPersonName}` : `for ${otherPersonName}`;

  return {
    subject: "Appointment Confirmed — SlicedBy_10",
    html: `
      <p>Hi ${recipientName},</p>
      <p>An appointment for <strong>${serviceName}</strong> ${verb} has been booked for:</p>
      <p><strong>${formattedTime}</strong></p>
      <p>— SlicedBy_10</p>
    `,
  };
}

export function buildCancellationEmail({
  recipientName,
  otherPersonName,
  serviceName,
  startTime,
  role,
}) {
  const formattedTime = new Date(startTime).toLocaleString();
  const verb =
    role === "customer" ? `with ${otherPersonName}` : `for ${otherPersonName}`;

  return {
    subject: "Appointment Cancelled — SlicedBy_10",
    html: `
      <p>Hi ${recipientName},</p>
      <p>Your appointment for <strong>${serviceName}</strong> ${verb}, originally scheduled for
      <strong>${formattedTime}</strong>, has been cancelled.</p>
      <p>— SlicedBy_10</p>
    `,
  };
}

export function buildReminderEmail({ recipientName, otherPersonName, serviceName, startTime, role }) {
  const verb = role === "customer" ? `with ${otherPersonName}` : `for ${otherPersonName}`;
  return {
    subject: "Appointment Reminder — SlicedBy_10",
    html: `<p>Hi ${recipientName},</p><p>This is a reminder for the <strong>${serviceName}</strong> appointment ${verb} on <strong>${new Date(startTime).toLocaleString()}</strong>.</p><p>— SlicedBy_10</p>`,
  };
}

export function buildReceiptEmail({ customerName, serviceName, barberName, amount, paymentMethod, paymentNote, cardBrand, cardLast4, paidAt }) {
  const method = paymentMethod === "CARD"
    ? `${cardBrand || "Card"}${cardLast4 ? ` ending in ${cardLast4}` : ""}`
    : paymentMethod === "OTHER" ? paymentNote || "Other" : "Cash";
  return {
    subject: "Payment Receipt — SlicedBy_10",
    html: `<p>Hi ${customerName},</p><h2>Payment receipt</h2><p>Service: <strong>${serviceName}</strong></p><p>Barber: ${barberName}</p><p>Amount: <strong>$${Number(amount).toFixed(2)}</strong></p><p>Payment method: ${method}</p><p>Paid: ${new Date(paidAt).toLocaleString()}</p><p>— SlicedBy_10</p>`,
  };
}
