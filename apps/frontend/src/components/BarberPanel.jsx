import { useState } from "react";
import { completeAppointment } from "../api/appointments.js";

export default function BarberPanel({
  appointments,
  currentUserId,
  token,
  onAppointmentChanged,
}) {
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);

  const myAppointments = appointments.filter(
    (appt) => appt.barber?.id === currentUserId,
  );

  async function handleComplete(appointmentId) {
    if (!window.confirm("Mark this service as completed?")) {
      return;
    }

    try {
      setError("");
      setWorkingId(appointmentId);

      await completeAppointment(appointmentId, token);

      await onAppointmentChanged();
    } catch (err) {
      setError(err.message || "Unable to complete appointment.");
    } finally {
      setWorkingId(null);
    }
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

  return (
    <section className="panel">
      <h2>Barber Dashboard</h2>

      <p>
        Manage your scheduled appointments and mark services completed after the
        visit.
      </p>

      {error ? <p className="status">{error}</p> : null}

      {myAppointments.length === 0 ? (
        <p>You do not have any appointments yet.</p>
      ) : (
        <ul className="item-list">
          {myAppointments.map((appt) => {
            const canComplete =
              appt.status !== "COMPLETED" && appt.status !== "CANCELLED";

            return (
              <li key={appt.id}>
                <strong>{appt.service.name}</strong>

                <p>
                  Customer: <strong>{appt.customer.name}</strong>
                </p>

                <p>{new Date(appt.startTime).toLocaleString()}</p>

                <p>
                  Status: <em>{appt.status}</em>
                  {" — "}
                  <em>{getPaymentLabel(appt)}</em>
                </p>

                {canComplete ? (
                  <button
                    type="button"
                    disabled={workingId === appt.id}
                    onClick={() => handleComplete(appt.id)}
                  >
                    {workingId === appt.id ? "Completing..." : "Mark Completed"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
