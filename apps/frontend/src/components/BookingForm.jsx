import { useState } from "react";
import { createAppointment } from "../api/appointments.js";

const emptyForm = { barberId: "", serviceId: "", startTime: "" };

export default function BookingForm({
  barbers,
  services,
  user,
  token,
  onBookingSuccess,
}) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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

      setStatus("Appointment booked successfully!");
      setForm(emptyForm, onBookingSuccess());
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
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
          />
        </label>

        {status ? <p className="status">{status}</p> : null}

        <button type="submit">Book Appointment</button>
      </form>
    </div>
  );
}
