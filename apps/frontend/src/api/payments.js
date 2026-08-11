const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function createCheckoutSession(bookingData, token) {
  const response = await fetch(
    `${API_BASE_URL}/payments/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to start checkout");
  }
  return data;
}

export async function verifyPaymentSession(sessionId, token) {
  const response = await fetch(
    `${API_BASE_URL}/payments/verify-session?sessionId=${sessionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to verify payment");
  }
  return data;
}

export async function createAppointmentPaymentSession(appointmentId, token) {
  const response = await fetch(
    `${API_BASE_URL}/payments/appointment/${appointmentId}/create-checkout-session`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to start payment");
  }
  return data;
}
