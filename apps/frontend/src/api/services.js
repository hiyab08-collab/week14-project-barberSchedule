const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchServices(search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_BASE_URL}/services${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  return response.json();
}

export async function updateService(id, service, token) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(service),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update service");
  }

  return data;
}

export async function deleteService(id, token) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete service");
  }
}

export async function createService(service, token) {
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(service),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create service");
  }

  return data;
}
