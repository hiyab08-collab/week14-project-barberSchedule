const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =========================
// GET ALL SERVICES
// =========================

export async function fetchServices(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  const response = await fetch(`${API_BASE_URL}/services${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  return response.json();
}

// =========================
// GET ONE SERVICE
// =========================

export async function fetchServiceById(id) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch service");
  }

  return response.json();
}

// =========================
// CREATE SERVICE
// =========================

export async function createService(serviceData, token) {
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },

    body: JSON.stringify(serviceData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create service");
  }

  return result;
}

// =========================
// UPDATE SERVICE
// =========================

export async function updateService(id, serviceData, token) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },

    body: JSON.stringify(serviceData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to update service");
  }

  return result;
}

// =========================
// DELETE SERVICE
// =========================

export async function deleteService(id, token) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "DELETE",

    headers: {
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(result.error || "Failed to delete service");
  }

  return true;
}
