import { useState } from "react";
import { updateProfile } from "../api/auth.js";

export default function ProfileForm({ user, token, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name || "", email: user.email || "", phone: user.phone || "",
    bio: user.barberProfile?.bio || "", specialties: user.barberProfile?.specialties || "",
    currentPassword: "", newPassword: "",
  });
  const [status, setStatus] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    try {
      setStatus("Saving...");
      const updated = await updateProfile(form, token);
      onUpdated(updated);
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setStatus("Profile updated.");
    } catch (error) { setStatus(error.message); }
  }

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  return (
    <details className="panel">
      <summary><strong>My Profile</strong></summary>
      <form className="form" onSubmit={submit}>
        <label>Name<input name="name" value={form.name} onChange={change} required /></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
        <label>Phone<input type="tel" name="phone" value={form.phone} onChange={change} /></label>
        {user.role === "BARBER" ? <>
          <label>Bio<textarea name="bio" value={form.bio} onChange={change} /></label>
          <label>Specialties<input name="specialties" value={form.specialties} onChange={change} /></label>
        </> : null}
        <label>
          Current password
          <div className="password-field">
            <input
              type={showCurrentPassword ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={change}
              placeholder="Required to change email or password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowCurrentPassword((current) => !current)}
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              aria-pressed={showCurrentPassword}
            >
              {showCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          New password
          <div className="password-field">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={change}
              minLength={8}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword((current) => !current)}
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              aria-pressed={showNewPassword}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {status ? <p className="status">{status}</p> : null}
        <button type="submit">Save Profile</button>
      </form>
    </details>
  );
}
