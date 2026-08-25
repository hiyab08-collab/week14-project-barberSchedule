import { useEffect, useState } from "react";

import { completeAppointment, createAppointment } from "../api/appointments.js";

import { fetchCustomers } from "../api/customers.js";

const emptyBookingForm = {
  customerId: "",
  serviceId: "",
  startTime: "",
};

export default function BarberPanel({
  appointments,
  services,
  currentUserId,
  token,
  onAppointmentChanged,
}) {
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);

  const [bookingStatus, setBookingStatus] = useState("");

  const [booking, setBooking] = useState(false);

  // =========================
  // BARBER'S APPOINTMENTS
  // =========================

  const myAppointments = appointments.filter(
    (appt) => appt.barber?.id === currentUserId,
  );

  const activeAppointments = myAppointments.filter(
    (appt) => appt.status !== "COMPLETED" && appt.status !== "CANCELLED",
  );

  const completedAppointments = myAppointments.filter(
    (appt) => appt.status === "COMPLETED",
  );

  // =========================
  // LOAD CUSTOMERS
  // =========================

  useEffect(() => {
    async function loadCustomers() {
      try {
        setError("");

        const data = await fetchCustomers(token);

        setCustomers(data);
      } catch (err) {
        setError(err.message || "Unable to load customers.");
      }
    }

    if (token) {
      loadCustomers();
    }
  }, [token]);

  // =========================
  // MARK COMPLETED
  // =========================

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

  // =========================
  // PHONE BOOKING FORM
  // =========================

  function handleBookingChange(event) {
    const { name, value } = event.target;

    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handlePhoneBooking(event) {
    event.preventDefault();

    setBookingStatus("");

    try {
      setBooking(true);

      await createAppointment(
        {
          customerId: Number(bookingForm.customerId),

          // The logged-in barber is always
          // assigned to this appointment.
          barberId: currentUserId,

          serviceId: Number(bookingForm.serviceId),

          startTime: new Date(bookingForm.startTime).toISOString(),
        },
        token,
      );

      setBookingStatus("Appointment booked successfully.");

      setBookingForm(emptyBookingForm);

      await onAppointmentChanged();
    } catch (err) {
      setBookingStatus(err.message || "Unable to book appointment.");
    } finally {
      setBooking(false);
    }
  }

  // =========================
  // PAYMENT LABEL
  // =========================

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

  // =========================
  // APPOINTMENT DISPLAY
  // =========================

  function renderAppointment(appt) {
    const canComplete =
      appt.status !== "COMPLETED" && appt.status !== "CANCELLED";

    return (
      <li key={appt.id}>
        <strong>{appt.service.name}</strong>

        <p>
          Customer: <strong>{appt.customer.name}</strong>
        </p>

        <p>Email: {appt.customer.email}</p>

        <p>{new Date(appt.startTime).toLocaleString()}</p>

        <p>Service price: ${appt.service.price}</p>

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
  }

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <section className="panel">
        <h2>Barber Dashboard</h2>

        <p>
          Manage your appointments and book appointments for customers who call
          the shop.
        </p>

        {error ? <p className="status">{error}</p> : null}
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Book for a Customer</h2>

          <p>Use this form when a customer calls to schedule an appointment.</p>

          <form className="form" onSubmit={handlePhoneBooking}>
            <label>
              Customer
              <select
                name="customerId"
                value={bookingForm.customerId}
                onChange={handleBookingChange}
                required
              >
                <option value="">Select a customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Service
              <select
                name="serviceId"
                value={bookingForm.serviceId}
                onChange={handleBookingChange}
                required
              >
                <option value="">Select a service</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ($
                    {service.price})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date & Time
              <input
                type="datetime-local"
                name="startTime"
                value={bookingForm.startTime}
                onChange={handleBookingChange}
                required
              />
            </label>

            {bookingStatus ? <p className="status">{bookingStatus}</p> : null}

            <button type="submit" disabled={booking}>
              {booking ? "Booking..." : "Book Appointment"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Scheduled Appointments</h2>

          {activeAppointments.length === 0 ? (
            <p>You do not have any scheduled appointments.</p>
          ) : (
            <ul className="item-list">
              {activeAppointments.map(renderAppointment)}
            </ul>
          )}
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Completed Appointments</h2>

          {completedAppointments.length === 0 ? (
            <p>You do not have any completed appointments yet.</p>
          ) : (
            <ul className="item-list">
              {completedAppointments.map(renderAppointment)}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}
