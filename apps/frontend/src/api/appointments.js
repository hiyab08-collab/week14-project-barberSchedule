const API_BASE_URL = "http://localhost:5000/api";

export async function fetchMyAppointments(token) {
  const response = await fetch(`${API_BASE_URL}/appointments/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch your appointments");
  }

  return response.json();
}

export async function cancelAppointment(appointmentId, token) {
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to cancel appointment");
  }

  return data;
}

export async function fetchAllAppointments(token) {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch all appointments");
  }

  return data;
}

export async function updateAppointmentAdmin(id, changes, token) {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update appointment");
  }

  return data;
}

export async function deleteAppointmentAdmin(id, token) {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete appointment");
  }
}

export async function createAppointment(appointment, token) {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appointment),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create appointment");
  }

  return data;
}
