import { useState } from "react";
import { cancelAppointment } from "../api/appointments.js";

export default function MyAppointments({
  appointments,
  currentUserId,
  token,
  onCancelled,
}) {
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
          const canCancel =
            appt.status !== "CANCELLED" && appt.status !== "COMPLETED";

          return (
            <li key={appt.id}>
              <strong>{appt.service.name}</strong> {roleLabel}{" "}
              {otherPerson.name}
              <p>
                {new Date(appt.startTime).toLocaleString()} —{" "}
                <em>{appt.status}</em>
              </p>
              {canCancel ? (
                <button type="button" onClick={() => handleCancel(appt.id)}>
                  Cancel
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
