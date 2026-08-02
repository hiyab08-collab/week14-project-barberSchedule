import { useState } from "react";
import { toggleLike } from "../api/barbers.js";
import { toggleFavoriteBarber } from "../api/favorites.js";
import Reviews from "./Reviews.jsx";

export default function BarbersSection({
  barbers,
  user,
  token,
  onLikeChanged,
  myFavorites,
  onFavoriteChanged,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [status, setStatus] = useState("");

  function isFavorited(barberId) {
    return myFavorites.some((fav) => fav.barberId === barberId);
  }

  async function handleFavorite(barberId) {
    try {
      await toggleFavoriteBarber(barberId, token);
      onFavoriteChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLike(barberId) {
    try {
      await toggleLike(barberId, token);
      onLikeChanged();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <article className="panel">
      <h2>Meet Our Barbers</h2>
      {status ? <p className="status">{status}</p> : null}
      <ul className="item-list">
        {barbers.map((barber) => (
          <li key={barber.id}>
            <strong>{barber.name}</strong>
            <p>{barber.barberProfile?.bio}</p>
            <button type="button" onClick={() => handleLike(barber.id)}>
              ♥ Like ({barber._count?.likesReceived ?? 0})
            </button>{" "}
            <button type="button" onClick={() => handleFavorite(barber.id)}>
              {isFavorited(barber.id) ? "★ Favorited" : "☆ Favorite"}
            </button>{" "}
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setExpandedId(expandedId === barber.id ? null : barber.id)
              }
            >
              {expandedId === barber.id ? "Hide reviews" : "See reviews"}
            </button>
            {expandedId === barber.id ? (
              <Reviews barberId={barber.id} user={user} token={token} />
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}
