import { useEffect, useState } from "react";
import { fetchServices } from "./api/services.js";
import { fetchBarbers } from "./api/barbers.js";
import { fetchMyAppointments } from "./api/appointments.js";
import { fetchMyFavorites } from "./api/favorites.js";
import { verifyPaymentSession } from "./api/payments.js";

import ServiceList from "./components/ServiceList.jsx";
import BookingForm from "./components/BookingForm.jsx";
import MyAppointments from "./components/MyAppointments.jsx";
import Cover from "./components/Cover.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import BarbersSection from "./components/BarbersSection.jsx";

export default function App() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]);

  const [status, setStatus] = useState("Loading services...");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );

  // =========================
  // THEME
  // =========================

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  // =========================
  // LOAD SHOP DATA
  // =========================

  async function loadShopData() {
    setStatus("Loading services...");

    // Load services separately so a barber error
    // does not display as a services error.
    try {
      const serviceData = await fetchServices();

      setServices(serviceData);
      setStatus("");
    } catch (error) {
      console.error("Failed to fetch services:", error);

      setStatus(error.message || "Failed to fetch services");
    }

    // Load barbers separately.
    try {
      const barberData = await fetchBarbers();

      setBarbers(barberData);
    } catch (error) {
      console.error("Failed to fetch barbers:", error);
    }
  }

  useEffect(() => {
    loadShopData();
  }, []);

  // =========================
  // LOAD PERSONAL DATA
  // =========================

  useEffect(() => {
    async function loadPersonalData() {
      if (!user || !token) {
        setMyAppointments([]);
        setMyFavorites([]);

        return;
      }

      try {
        const [appointmentData, favoriteData] = await Promise.all([
          fetchMyAppointments(token),
          fetchMyFavorites(token),
        ]);

        setMyAppointments(appointmentData);
        setMyFavorites(favoriteData);
      } catch (error) {
        console.error(error.message);
      }
    }

    loadPersonalData();
  }, [user, token]);

  // =========================
  // HANDLE PAYMENT RETURN
  // =========================

  useEffect(() => {
    async function handlePaymentReturn() {
      const params = new URLSearchParams(window.location.search);

      const sessionId = params.get("session_id");
      const cancelled = params.get("payment");

      if (cancelled === "cancelled") {
        setPaymentStatus("Payment was cancelled. No appointment was booked.");

        window.history.replaceState({}, "", window.location.pathname);

        return;
      }

      if (!sessionId || !user || !token) {
        return;
      }

      setPaymentStatus("Confirming your payment...");

      try {
        await verifyPaymentSession(sessionId, token);

        setPaymentStatus("Payment confirmed!");

        const appointmentData = await fetchMyAppointments(token);

        setMyAppointments(appointmentData);
      } catch (error) {
        setPaymentStatus(error.message);
      } finally {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    handlePaymentReturn();
  }, [user, token]);

  // =========================
  // SEARCH SERVICES
  // =========================

  async function handleSearch(event) {
    event.preventDefault();

    try {
      // Clear an old error before starting
      // a new services search.
      setStatus("");

      const data = await fetchServices(searchTerm);

      setServices(data);

      // Successful search means there is
      // no services error to display.
      setStatus("");
    } catch (error) {
      console.error("Service search failed:", error);

      setStatus(error.message || "Failed to fetch services");
    }
  }

  // =========================
  // AUTH
  // =========================

  function handleAuthSuccess(newUser, newToken) {
    setUser(newUser);
    setToken(newToken);

    localStorage.setItem("user", JSON.stringify(newUser));

    localStorage.setItem("token", newToken);
  }

  function handleLogout() {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setMyAppointments([]);
    setMyFavorites([]);
  }

  // =========================
  // APPOINTMENT REFRESH
  // =========================

  async function handleAppointmentsChanged() {
    if (!token) {
      return;
    }

    try {
      const data = await fetchMyAppointments(token);

      setMyAppointments(data);
    } catch (error) {
      console.error("Failed to refresh appointments:", error);
    }
  }

  // =========================
  // FAVORITES REFRESH
  // =========================

  async function handleFavoriteChanged() {
    if (!token) {
      return;
    }

    try {
      const data = await fetchMyFavorites(token);

      setMyFavorites(data);
    } catch (error) {
      console.error("Failed to refresh favorites:", error);
    }
  }

  // =========================
  // PAGE
  // =========================

  return (
    <main className="page">
      <header className="site-header">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
        </button>
      </header>

      {!user ? (
        <Cover onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          <section className="panel">
            <p className="eyebrow">SlicedBy_N10</p>

            <h1>Welcome back, {user.name}</h1>

            <p>
              {user.name} ({user.role}){" "}
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </p>
          </section>

          {paymentStatus ? (
            <section className="panel">
              <p className="status">{paymentStatus}</p>
            </section>
          ) : null}

          {user.role === "ADMIN" ? (
            <AdminPanel
              services={services}
              barbers={barbers}
              token={token}
              onDataChanged={loadShopData}
            />
          ) : (
            <>
              <section className="grid">
                <article className="panel">
                  <h2>Our Services</h2>

                  <form className="form" onSubmit={handleSearch}>
                    <label>
                      Search services
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="e.g. fade"
                      />
                    </label>

                    <button type="submit">Search</button>
                  </form>

                  {status ? <p className="status">{status}</p> : null}

                  <ServiceList
                    services={services}
                    token={token}
                    myFavorites={myFavorites}
                    onFavoriteChanged={handleFavoriteChanged}
                  />
                </article>

                <BookingForm
                  barbers={barbers}
                  services={services}
                  user={user}
                  token={token}
                  onBookingSuccess={handleAppointmentsChanged}
                />
              </section>

              <section className="grid">
                <BarbersSection
                  barbers={barbers}
                  user={user}
                  token={token}
                  onLikeChanged={loadShopData}
                  myFavorites={myFavorites}
                  onFavoriteChanged={handleFavoriteChanged}
                />
              </section>

              <section className="grid">
                <article className="panel">
                  <h2>My Appointments</h2>

                  <MyAppointments
                    appointments={myAppointments}
                    currentUserId={user.id}
                    token={token}
                    onCancelled={handleAppointmentsChanged}
                  />
                </article>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
