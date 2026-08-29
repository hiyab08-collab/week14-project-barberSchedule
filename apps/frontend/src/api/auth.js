const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function signup({ name, email, password, role }) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to sign up");
  }

  return data;
}

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to log in");
  }

  return data;
}

export async function updateProfile(profile, token) {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(profile),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update profile");
  return data;
}
