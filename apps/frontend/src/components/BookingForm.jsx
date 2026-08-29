import { useState } from "react";
import { createAppointment } from "../api/appointments.js";
import { createCheckoutSession } from "../api/payments.js";
import { minimumBookingDateTime } from "../utils/dateTime.js";

const emptyForm = { barberId: "", serviceId: "", startTime: "" };

export default function BookingForm({
  barbers,
  services,
  user,
  token,
  onBookingSuccess,
}) {
  const [form, setForm] = useState(emptyForm);
  const [paymentMethod, setPaymentMethod] = useState("in-person");
  const [status, setStatus] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (paymentMethod === "online") {
      setStatus("Redirecting to payment...");
      try {
        const { url } = await createCheckoutSession(
          {
            barberId: Number(form.barberId),
            serviceId: Number(form.serviceId),
            startTime: new Date(form.startTime).toISOString(),
          },
          token,
        );
        window.location.href = url;
      } catch (error) {
        setStatus(error.message);
      }
      return;
    }

    setStatus("Booking...");
    try {
      await createAppointment(
        {
          customerId: user.id,
          barberId: Number(form.barberId),
          serviceId: Number(form.serviceId),
          startTime: new Date(form.startTime).toISOString(),
        },
        token,
      );
      setStatus(
        "Appointment booked successfully! Pay in person at your visit.",
      );
      setForm(emptyForm);
      onBookingSuccess();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="panel">
      <h2>Book an Appointment</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Barber
          <select
            name="barberId"
            value={form.barberId}
            onChange={handleChange}
            required
          >
            <option value="">Select a barber</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Service
          <select
            name="serviceId"
            value={form.serviceId}
            onChange={handleChange}
            required
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} (${service.price})
              </option>
            ))}
          </select>
        </label>
        <label>
          Date & Time
          <input
            type="datetime-local"
            min={minimumBookingDateTime()}
            name="startTime"
            value={form.startTime}
            onChange={(event) => {
              event.target.setCustomValidity("");
              handleChange(event);
            }}
            onInvalid={(event) =>
              event.target.setCustomValidity("Choose a future date and time.")
            }
            required
          />
        </label>

        <fieldset className="payment-method-group">
          <legend>Payment</legend>
          <label className="radio-option">
            <input
              type="radio"
              name="paymentMethod"
              value="in-person"
              checked={paymentMethod === "in-person"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Pay in person at appointment
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Pay online now
          </label>
        </fieldset>

        {status ? <p className="status">{status}</p> : null}
        <button type="submit">
          {paymentMethod === "online"
            ? "Proceed to Payment"
            : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}
