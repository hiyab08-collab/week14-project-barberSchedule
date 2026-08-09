import { useState } from "react";
import { login, signup } from "../api/auth.js";

const emptyForm = { name: "", email: "", password: "" };

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const result =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await signup({
              name: form.name,
              email: form.email,
              password: form.password,
              role: "CUSTOMER",
            });

      onAuthSuccess(result.user, result.token);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <h2>{mode === "login" ? "Log In" : "Sign Up"}</h2>

      <form className="form" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
        ) : null}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error ? <p className="status">{error}</p> : null}

        <button type="submit">{mode === "login" ? "Log In" : "Sign Up"}</button>
      </form>

      <button
        type="button"
        className="link-button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}
