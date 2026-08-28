import { useState } from "react";

import { cancelAppointment } from "../api/appointments.js";
import { createAppointmentPaymentSession } from "../api/payments.js";
import { buildGoogleCalendarUrl, downloadIcsFile } from "../utils/calendar.js";
import { formatDateTime } from "../utils/dateTime.js";

export default function MyAppointments({
  appointments,
  currentUserId,
  token,
  onCancelled,
}) {
  const [error, setError] = useState("");

  async function handleCancel(appointmentId) {
    if (!window.confirm("Cancel this appointment?")) {
      return;
    }

    setError("");

    try {
      await cancelAppointment(appointmentId, token);

      onCancelled();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePayNow(appointmentId) {
    setError("");

    try {
      const { url } = await createAppointmentPaymentSession(
        appointmentId,
        token,
      );

      window.location.href = url;
    } catch (err) {
      setError(err.message);
    }
  }

  function downloadReceipt(appt) {
    const cardDescription = appt.cardLast4
      ? `${appt.cardBrand || "Card"} ending in ${appt.cardLast4}`
      : "Card";
    const method = appt.paymentMethod === "CARD"
      ? cardDescription
      : appt.paymentMethod === "OTHER"
        ? appt.paymentNote || "Other"
        : "Cash";
    const receipt = [
      "SlicedBy_10 Payment Receipt",
      `Receipt #${appt.id}`,
      `Service: ${appt.service.name}`,
      `Barber: ${appt.barber.name}`,
      `Appointment: ${formatDateTime(appt.startTime)}`,
      `Amount: $${Number(appt.service.price).toFixed(2)}`,
      `Payment method: ${method}`,
      `Paid: ${formatDateTime(appt.paidAt)}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${appt.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function calendarEventDetails(appt, otherPerson) {
    return {
      title: `${appt.service.name} at SlicedBy_N10`,

      description: `Appointment with ${otherPerson.name} for ${appt.service.name}.`,

      startTime: appt.startTime,

      durationMinutes: appt.service.durationMinutes,
    };
  }

  function getPaymentLabel(appt) {
    if (appt.refunded) {
      return "Refunded";
    }

    if (appt.paid) {
      return "Paid";
    }

    if (appt.status === "COMPLETED") {
      return "Payment due";
    }

    return "Not paid";
  }

  if (appointments.length === 0) {
    return <p>You have no appointments yet.</p>;
  }

  return (
    <>
      {error ? <p className="status">{error}</p> : null}

      <ul className="item-list">
        {appointments.map((appt) => {
          const isCustomer = appt.customer.id === currentUserId;

          const otherPerson = isCustomer ? appt.barber : appt.customer;

          const roleLabel = isCustomer ? "with" : "for";

          // Customers/barbers may cancel
          // only before the service is
          // completed or already cancelled.
          const canCancel =
            appt.status !== "CANCELLED" && appt.status !== "COMPLETED";

          // Pay Now is only for a completed
          // service that has not already
          // been paid.
          const needsPayment =
            isCustomer &&
            appt.status === "COMPLETED" &&
            !appt.paid &&
            !appt.refunded;

          const eventDetails = calendarEventDetails(appt, otherPerson);

          const paymentLabel = getPaymentLabel(appt);

          return (
            <li key={appt.id}>
              <strong>{appt.service.name}</strong> {roleLabel}{" "}
              {otherPerson.name}
              <p>
                {formatDateTime(appt.startTime)}
                {" — "}
                <em>{appt.status}</em>
                {" — "}
                <em>{paymentLabel}</em>
              </p>
              {/* ========================= */}
              {/* PAY AFTER SERVICE */}
              {/* ========================= */}
              {needsPayment ? (
                <button type="button" onClick={() => handlePayNow(appt.id)}>
                  Pay Now ($
                  {appt.service.price})
                </button>
              ) : null}
              {isCustomer && appt.paid ? (
                <>
                  <p>
                    Payment method: <strong>
                      {appt.paymentMethod === "CARD" && appt.cardLast4
                        ? `${appt.cardBrand || "Card"} ending in ${appt.cardLast4}`
                        : appt.paymentMethod === "OTHER"
                          ? appt.paymentNote || "OTHER"
                          : appt.paymentMethod}
                    </strong>
                  </p>
                  {appt.paidAt ? <p>Paid: {formatDateTime(appt.paidAt)}</p> : null}
                  <button type="button" onClick={() => downloadReceipt(appt)}>
                    Download Receipt
                  </button>{" "}
                </>
              ) : null}
              {/* ========================= */}
              {/* UPCOMING APPOINTMENT */}
              {/* ========================= */}
              {canCancel ? (
                <>
                  <a
                    href={buildGoogleCalendarUrl(eventDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button type="button">Add to Google Calendar</button>
                  </a>{" "}
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(eventDetails)}
                  >
                    Download .ics
                  </button>{" "}
                  <button type="button" onClick={() => handleCancel(appt.id)}>
                    Cancel
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
