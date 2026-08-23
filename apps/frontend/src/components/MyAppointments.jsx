import { useState } from "react";
import { cancelAppointment } from "../api/appointments.js";
import { createAppointmentPaymentSession } from "../api/payments.js";
import { buildGoogleCalendarUrl, downloadIcsFile } from "../utils/calendar.js";

export default function MyAppointments({ appointments, currentUserId, token, onCancelled }) {
  const [error, setError] = useState("");

  async function handleCancel(appointmentId) {
    if (!window.confirm("Cancel this appointment?")) return;
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
      const { url } = await createAppointmentPaymentSession(appointmentId, token);
      window.location.href = url;
    } catch (err) {
      setError(err.message);
    }
  }

  function calendarEventDetails(appt, otherPerson) {
    return {
      title: `${appt.service.name} at SlicedBy_10`,
      description: `Appointment with ${otherPerson.name} for ${appt.service.name}.`,
      startTime: appt.startTime,
      durationMinutes: appt.service.durationMinutes,
    };
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
          const canCancel = appt.status !== "CANCELLED" && appt.status !== "COMPLETED";
          const needsPayment =
            isCustomer && appt.status === "COMPLETED" && !appt.paid;
          const eventDetails = calendarEventDetails(appt, otherPerson);

          return (
            <li key={appt.id}>
              <strong>{appt.service.name}</strong> {roleLabel} {otherPerson.name}
              <p>
                {new Date(appt.startTime).toLocaleString()} — <em>{appt.status}</em>
                {appt.status === "COMPLETED" ? (
                  <> — <em>{appt.paid ? "Paid" : "Payment due"}</em></>
                ) : null}
              </p>
              {needsPayment ? (
                <button type="button" onClick={() => handlePayNow(appt.id)}>
                  Pay Now (${appt.service.price})
                </button>
              ) : null}
              {canCancel ? (
                <>
                  <a
                    href={buildGoogleCalendarUrl(eventDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button type="button">Add to Google Calendar</button>
                  </a>{" "}
                  <button type="button" onClick={() => downloadIcsFile(eventDetails)}>
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