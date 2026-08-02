import { toggleFavoriteService } from "../api/favorites.js";

export default function ServiceList({
  services,
  token,
  myFavorites,
  onFavoriteChanged,
}) {
  function isFavorited(serviceId) {
    return myFavorites.some((fav) => fav.serviceId === serviceId);
  }

  async function handleFavorite(serviceId) {
    await toggleFavoriteService(serviceId, token);
    onFavoriteChanged();
  }

  if (services.length === 0) {
    return <p>No services yet.</p>;
  }

  return (
    <ul className="item-list">
      {services.map((service) => (
        <li key={service.id}>
          <strong>{service.name}</strong> — ${service.price} (
          {service.durationMinutes} min)
          {service.description ? <p>{service.description}</p> : null}
          <button type="button" onClick={() => handleFavorite(service.id)}>
            {isFavorited(service.id) ? "★ Favorited" : "☆ Favorite"}
          </button>
        </li>
      ))}
    </ul>
  );
}
