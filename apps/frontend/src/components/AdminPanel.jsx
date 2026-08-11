import { useEffect, useState } from "react";
import {
  createService,
  updateService,
  deleteService,
} from "../api/services.js";
import { createBarber, updateBarber, deleteBarber } from "../api/barbers.js";
import {
  fetchAllAppointments,
  updateAppointmentAdmin,
  deleteAppointmentAdmin,
} from "../api/appointments.js";

const emptyService = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
};
const emptyBarber = {
  name: "",
  email: "",
  password: "",
  bio: "",
  specialties: "",
};

export default function AdminPanel({
  services,
  barbers,
  token,
  onDataChanged,
}) {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");

  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [barberForm, setBarberForm] = useState(emptyBarber);
  const [editingBarberId, setEditingBarberId] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      const data = await fetchAllAppointments(token);
      setAppointments(data);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function startEditingService(service) {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      durationMinutes: service.durationMinutes,
    });
  }

  async function handleServiceSubmit(event) {
    event.preventDefault();
    const payload = {
      ...serviceForm,
      price: Number(serviceForm.price),
      durationMinutes: Number(serviceForm.durationMinutes),
    };

    try {
      if (editingServiceId) {
        await updateService(editingServiceId, payload, token);
        setStatus("Service updated.");
      } else {
        await createService(payload, token);
        setStatus("Service created.");
      }
      setServiceForm(emptyService);
      setEditingServiceId(null);
      onDataChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDeleteService(id) {
    if (
      !window.confirm(
        "Permanently delete this appointment? This cannot be undone.",
      )
    )
      return;
    try {
      await deleteService(id, token);
      setStatus("Service deleted.");
      onDataChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  function startEditingBarber(barber) {
    setEditingBarberId(barber.id);
    setBarberForm({
      name: barber.name,
      email: barber.email,
      password: "",
      bio: barber.barberProfile?.bio || "",
      specialties: barber.barberProfile?.specialties || "",
    });
  }

  async function handleBarberSubmit(event) {
    event.preventDefault();

    try {
      if (editingBarberId) {
        await updateBarber(
          editingBarberId,
          {
            name: barberForm.name,
            bio: barberForm.bio,
            specialties: barberForm.specialties,
          },
          token,
        );
        setStatus("Barber updated.");
      } else {
        await createBarber(barberForm, token);
        setStatus("Barber created.");
      }
      setBarberForm(emptyBarber);
      setEditingBarberId(null);
      onDataChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDeleteBarber(id) {
    if (!window.confirm("Delete this barber? This cannot be undone.")) return;
    try {
      await deleteBarber(id, token);
      setStatus("Barber deleted.");
      onDataChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateAppointmentAdmin(id, { status: newStatus }, token);
      loadAppointments();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDeleteAppointment(id) {
    try {
      await deleteAppointmentAdmin(id, token);
      loadAppointments();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <>
      {status ? <p className="status">{status}</p> : null}

      <section className="grid">
        <article className="panel">
          <h2>{editingServiceId ? "Edit Service" : "Add Service"}</h2>
          <form className="form" onSubmit={handleServiceSubmit}>
            <label>
              Name
              <input
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, name: e.target.value })
                }
                required
              />
            </label>
            <label>
              Description
              <input
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Price
              <input
                type="number"
                step="0.01"
                value={serviceForm.price}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, price: e.target.value })
                }
                required
              />
            </label>
            <label>
              Duration (minutes)
              <input
                type="number"
                value={serviceForm.durationMinutes}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    durationMinutes: e.target.value,
                  })
                }
                required
              />
            </label>
            <button type="submit">
              {editingServiceId ? "Save Changes" : "Add Service"}
            </button>
            {editingServiceId ? (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setEditingServiceId(null);
                  setServiceForm(emptyService);
                }}
              >
                Cancel editing
              </button>
            ) : null}
          </form>
        </article>

        <article className="panel">
          <h2>{editingBarberId ? "Edit Barber" : "Add Barber"}</h2>
          <form className="form" onSubmit={handleBarberSubmit}>
            <label>
              Name
              <input
                value={barberForm.name}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, name: e.target.value })
                }
                required
              />
            </label>
            {!editingBarberId ? (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    value={barberForm.email}
                    onChange={(e) =>
                      setBarberForm({ ...barberForm, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={barberForm.password}
                    onChange={(e) =>
                      setBarberForm({ ...barberForm, password: e.target.value })
                    }
                    required
                  />
                </label>
              </>
            ) : null}
            <label>
              Bio
              <input
                value={barberForm.bio}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, bio: e.target.value })
                }
              />
            </label>
            <label>
              Specialties
              <input
                value={barberForm.specialties}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, specialties: e.target.value })
                }
              />
            </label>
            <button type="submit">
              {editingBarberId ? "Save Changes" : "Add Barber"}
            </button>
            {editingBarberId ? (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setEditingBarberId(null);
                  setBarberForm(emptyBarber);
                }}
              >
                Cancel editing
              </button>
            ) : null}
          </form>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Manage Services</h2>
          <ul className="item-list">
            {services.map((service) => (
              <li key={service.id}>
                <strong>{service.name}</strong> — ${service.price} (
                {service.durationMinutes} min)
                <p>{service.description}</p>
                <button
                  type="button"
                  onClick={() => startEditingService(service)}
                >
                  Edit
                </button>{" "}
                <button
                  type="button"
                  onClick={() => handleDeleteService(service.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Manage Barbers</h2>
          <ul className="item-list">
            {barbers.map((barber) => (
              <li key={barber.id}>
                <strong>{barber.name}</strong> — {barber.email}
                <p>{barber.barberProfile?.bio}</p>
                <button
                  type="button"
                  onClick={() => startEditingBarber(barber)}
                >
                  Edit
                </button>{" "}
                <button
                  type="button"
                  onClick={() => handleDeleteBarber(barber.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>All Appointments</h2>
          <ul className="item-list">
            {appointments.map((appt) => (
              <li key={appt.id}>
                <strong>{appt.service.name}</strong> — {appt.customer.name} with{" "}
                {appt.barber.name}
                <p>
                  {new Date(appt.startTime).toLocaleString()} —{" "}
                  <em>{appt.status}</em>
                  {appt.status === "COMPLETED" ? (
                    <>
                      {" "}
                      — <em>{appt.paid ? "Paid" : "Payment due"}</em>
                    </>
                  ) : null}
                </p>
                {appt.status !== "CANCELLED" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(appt.id, "CANCELLED")}
                  >
                    Cancel
                  </button>
                ) : null}{" "}
                {appt.status === "PENDING" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(appt.id, "CONFIRMED")}
                  >
                    Confirm
                  </button>
                ) : null}{" "}
                {appt.status === "PENDING" || appt.status === "CONFIRMED" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(appt.id, "COMPLETED")}
                  >
                    Mark Complete
                  </button>
                ) : null}{" "}
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(appt.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
