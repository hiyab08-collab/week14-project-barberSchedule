const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchCustomers(token) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch customers");
  }

  return data;
}

export async function createCustomer(customer, token) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(customer),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create customer");
  }

  return data;
}
