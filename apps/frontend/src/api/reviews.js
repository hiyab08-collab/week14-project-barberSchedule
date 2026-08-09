const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchReviews({ barberId, serviceId }) {
  const query = barberId ? `barberId=${barberId}` : `serviceId=${serviceId}`;
  const response = await fetch(`${API_BASE_URL}/reviews?${query}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch reviews");
  }

  return data;
}

export async function createReview(formData, token) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to submit review");
  }

  return data;
}
