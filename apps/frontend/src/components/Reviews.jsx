import { useEffect, useState } from "react";
import { fetchReviews, createReview } from "../api/reviews.js";

export default function Reviews({ barberId, serviceId, user, token }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadReviews();
  }, [barberId, serviceId]);

  async function loadReviews() {
    try {
      const data = await fetchReviews({ barberId, serviceId });
      setReviews(data);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Submitting...");

    const formData = new FormData();
    if (barberId) formData.append("barberId", barberId);
    if (serviceId) formData.append("serviceId", serviceId);
    formData.append("rating", rating);
    formData.append("comment", comment);
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    try {
      await createReview(formData, token);
      setComment("");
      setMediaFile(null);
      setStatus("Review submitted.");
      loadReviews();
    } catch (error) {
      setStatus(error.message);
    }
  }

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : null;

  return (
    <div>
      <p>
        {average
          ? `★ ${average} (${reviews.length} review${reviews.length === 1 ? "" : "s"})`
          : "No reviews yet."}
      </p>

      {reviews.map((review) => (
        <div key={review.id} className="review-item">
          <p>
            <strong>{"★".repeat(review.rating)}</strong> —{" "}
            {review.customer.name}
            {review.comment ? `: ${review.comment}` : ""}
          </p>
          {review.mediaUrl && review.mediaType === "image" ? (
            <img
              src={review.mediaUrl}
              alt="Customer's cut"
              className="review-media"
            />
          ) : null}
          {review.mediaUrl && review.mediaType === "video" ? (
            <video src={review.mediaUrl} controls className="review-media" />
          ) : null}
        </div>
      ))}

      {user ? (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Rating
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Not great</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>
          <label>
            Comment
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Photo or video (optional)
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
            />
          </label>
          {status ? <p className="status">{status}</p> : null}
          <button type="submit">Submit Review</button>
        </form>
      ) : null}
    </div>
  );
}
