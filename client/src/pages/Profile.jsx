import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as usersService from "../services/users.service.js";

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user.full_name || user.fullName || "",
    email: user.email || "",
    gender: user.gender || "",
    defaultRole: user.default_role || "both",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      await usersService.updateMe(form);
      await refreshUser();
      setInfo("Profile updated");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const name = user.full_name || user.fullName || "You";

  return (
    <AppShell>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {name.trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-gray-500">{user.phone}</p>
          {user.rating_avg && (
            <p className="text-xs text-gray-400">
              {Number(user.rating_avg).toFixed(1)} rating - {user.total_rides ?? 0} rides
            </p>
          )}
        </div>
      </div>

      <div className="mt-4"><Alert kind="success">{info}</Alert><Alert>{error}</Alert></div>

      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Gender</span>
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">I usually</span>
              <select value={form.defaultRole} onChange={(e) => setForm((f) => ({ ...f, defaultRole: e.target.value }))}
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3">
                <option value="rider">Need rides</option>
                <option value="driver">Drive</option>
                <option value="both">Both</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" type="button" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" loading={busy}>Save</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit profile</Button>
        </div>
      )}

      {/* Links to the rest of the account area */}
      <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {[
          { to: "/vehicles", label: "My vehicles" },
          { to: "/notifications", label: "Notifications" },
          { to: "/safety", label: "Safety and SOS" },
        ].map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-gray-50">
              {l.label}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-gray-300">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Button variant="danger" onClick={logout}>Log out</Button>
      </div>
    </AppShell>
  );
}
