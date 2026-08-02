const API_BASE_URL = "http://localhost:5000/api";

export async function fetchBarbers() {
  const response = await fetch(`${API_BASE_URL}/barbers`);

  if (!response.ok) {
    throw new Error("Failed to fetch barbers");
  }

  return response.json();
}

export async function toggleLike(barberId, token) {
  const response = await fetch(`${API_BASE_URL}/barbers/${barberId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to toggle like");
  }

  return data;
}

export async function createBarber(barber, token) {
  const response = await fetch(`${API_BASE_URL}/barbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(barber),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create barber");
  }

  return data;
}

export async function updateBarber(id, barber, token) {
  const response = await fetch(`${API_BASE_URL}/barbers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(barber),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update barber");
  }

  return data;
}

export async function deleteBarber(id, token) {
  const response = await fetch(`${API_BASE_URL}/barbers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete barber");
  }
}
