import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setBusy(true);
    try {
      await register(form);
      navigate("/"); // registered = logged in (backend returns tokens)
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-700">Create account</h1>
      <p className="mt-1 text-gray-500">Start sharing rides in minutes.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Input label="Full name" value={form.fullName} onChange={set("fullName")} placeholder="Your name" autoFocus />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
        <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91XXXXXXXXXX" />
        <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" />
        <Alert>{error}</Alert>
        <Button type="submit" loading={busy}>Sign up</Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
