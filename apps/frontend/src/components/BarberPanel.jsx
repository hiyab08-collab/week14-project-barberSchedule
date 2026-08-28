import { useEffect, useState } from "react";

import {
  completeAppointment,
  createAppointment,
  recordAppointmentPayment,
} from "../api/appointments.js";

import { fetchCustomers, createCustomer } from "../api/customers.js";
import { createAppointmentPaymentSession } from "../api/payments.js";
import { formatDateTime } from "../utils/dateTime.js";

const emptyBookingForm = {
  customerId: "",
  serviceId: "",
  startTime: "",
};

const emptyCustomerForm = {
  name: "",
  email: "",
  phone: "",
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

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  const [bookingStatus, setBookingStatus] = useState("");

  const [customerStatus, setCustomerStatus] = useState("");

  const [booking, setBooking] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState({});
  const [paymentNotes, setPaymentNotes] = useState({});

  const [recordingPaymentId, setRecordingPaymentId] = useState(null);

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

  async function loadCustomers() {
    try {
      setError("");

      const data = await fetchCustomers(token);

      setCustomers(data);
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    }
  }

  useEffect(() => {
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
  // RECORD PAYMENT
  // =========================

  function handlePaymentMethodChange(appointmentId, value) {
    setPaymentMethods((current) => ({
      ...current,
      [appointmentId]: value,
    }));
  }

  async function handleRecordPayment(appointmentId) {
    const paymentMethod = paymentMethods[appointmentId] || "CASH";
    const paymentNote = paymentNotes[appointmentId]?.trim() || "";

    if (paymentMethod === "OTHER" && !paymentNote) {
      setError("Enter the payment type before recording an Other payment.");
      return;
    }

    if (paymentMethod === "CARD") {
      try {
        setError("");
        setRecordingPaymentId(appointmentId);

        const { url } = await createAppointmentPaymentSession(
          appointmentId,
          token,
        );

        window.location.href = url;
      } catch (err) {
        setError(err.message || "Unable to start card payment.");
        setRecordingPaymentId(null);
      }
      return;
    }

    if (
      !window.confirm(`Record this appointment as paid by ${paymentMethod}?`)
    ) {
      return;
    }

    try {
      setError("");
      setRecordingPaymentId(appointmentId);

      await recordAppointmentPayment(
        appointmentId,
        paymentMethod,
        paymentNote,
        token,
      );

      await onAppointmentChanged();
    } catch (err) {
      setError(err.message || "Unable to record payment.");
    } finally {
      setRecordingPaymentId(null);
    }
  }

  // =========================
  // NEW CUSTOMER FORM
  // =========================

  function handleCustomerChange(event) {
    const { name, value } = event.target;

    setCustomerForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateCustomer(event) {
    event.preventDefault();

    setCustomerStatus("");

    try {
      setCreatingCustomer(true);

      const newCustomer = await createCustomer(
        {
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
        },
        token,
      );

      setCustomerStatus("Customer created successfully.");

      setCustomerForm(emptyCustomerForm);

      await loadCustomers();

      setBookingForm((current) => ({
        ...current,
        customerId: String(newCustomer.id),
      }));
    } catch (err) {
      setCustomerStatus(err.message || "Unable to create customer.");
    } finally {
      setCreatingCustomer(false);
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

    const needsPayment =
      appt.status === "COMPLETED" && !appt.paid && !appt.refunded;

    return (
      <li key={appt.id}>
        <strong>{appt.service.name}</strong>

        <p>
          Customer: <strong>{appt.customer.name}</strong>
        </p>

        {appt.customer.email ? <p>Email: {appt.customer.email}</p> : null}

        {appt.customer.phone ? <p>Phone: {appt.customer.phone}</p> : null}

        <p>{formatDateTime(appt.startTime)}</p>

        <p>Service price: ${appt.service.price}</p>

        <p>
          Status: <em>{appt.status}</em>
          {" — "}
          <em>{getPaymentLabel(appt)}</em>
        </p>

        {appt.paid && appt.paymentMethod ? (
          <p>
            Payment method: <strong>{appt.paymentMethod}</strong>
          </p>
        ) : null}

        {appt.paid && appt.paymentMethod === "OTHER" && appt.paymentNote ? (
          <p>
            Payment note: <strong>{appt.paymentNote}</strong>
          </p>
        ) : null}

        {appt.paid && appt.paidAt ? (
          <p>Paid: {formatDateTime(appt.paidAt)}</p>
        ) : null}

        {canComplete ? (
          <button
            type="button"
            disabled={workingId === appt.id}
            onClick={() => handleComplete(appt.id)}
          >
            {workingId === appt.id ? "Completing..." : "Mark Completed"}
          </button>
        ) : null}

        {needsPayment ? (
          <div className="form">
            <label>
              Payment Method
              <select
                value={paymentMethods[appt.id] || "CASH"}
                onChange={(event) =>
                  handlePaymentMethodChange(appt.id, event.target.value)
                }
              >
                <option value="CASH">Cash</option>

                <option value="CARD">Card</option>

                <option value="OTHER">Other</option>
              </select>
            </label>

            {(paymentMethods[appt.id] || "CASH") === "OTHER" ? (
              <label>
                Payment Type
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Zelle, Cash App, Venmo"
                  value={paymentNotes[appt.id] || ""}
                  onChange={(event) =>
                    setPaymentNotes((current) => ({
                      ...current,
                      [appt.id]: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <button
              type="button"
              disabled={recordingPaymentId === appt.id}
              onClick={() => handleRecordPayment(appt.id)}
            >
              {recordingPaymentId === appt.id
                ? "Working..."
                : (paymentMethods[appt.id] || "CASH") === "CARD"
                  ? "Continue to Stripe"
                  : "Record Payment"}
            </button>
          </div>
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
          Manage appointments, create customers, and book appointments for
          callers.
        </p>

        {error ? <p className="status">{error}</p> : null}
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Add New Customer</h2>

          <form className="form" onSubmit={handleCreateCustomer}>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={handleCustomerChange}
                required
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                name="phone"
                value={customerForm.phone}
                onChange={handleCustomerChange}
                placeholder="Optional if email is provided"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={customerForm.email}
                onChange={handleCustomerChange}
                placeholder="Optional if phone is provided"
              />
            </label>

            {customerStatus ? <p className="status">{customerStatus}</p> : null}

            <button type="submit" disabled={creatingCustomer}>
              {creatingCustomer ? "Creating..." : "Add Customer"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Book for a Customer</h2>

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
                    {customer.name}
                    {customer.email
                      ? ` — ${customer.email}`
                      : customer.phone
                        ? ` — ${customer.phone}`
                        : ""}
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
      </section>

      <section className="grid">
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
