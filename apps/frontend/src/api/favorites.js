const API_BASE_URL = "http://localhost:5000/api";

export async function fetchMyFavorites(token) {
  const response = await fetch(`${API_BASE_URL}/favorites/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch favorites");
  }

  return data;
}

export async function toggleFavoriteBarber(barberId, token) {
  const response = await fetch(`${API_BASE_URL}/favorites/barber/${barberId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to toggle favorite");
  }

  return data;
}

export async function toggleFavoriteService(serviceId, token) {
  const response = await fetch(
    `${API_BASE_URL}/favorites/service/${serviceId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to toggle favorite");
  }

  return data;
}
