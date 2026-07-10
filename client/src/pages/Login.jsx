import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as authService from "../services/auth.service.js";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";

// Two ways in: password (email/phone) or phone OTP — same as the backend.
export default function Login() {
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-700">coRide</h1>
      <p className="mt-1 text-gray-500">Share your ride. Split the fare.</p>

      {/* mode switch */}
      <div className="mt-8 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-medium">
        {["password", "otp"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`h-10 rounded-lg transition-colors ${
              mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
            }`}
          >
            {m === "password" ? "Password" : "Phone OTP"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mode === "password" ? <PasswordForm onDone={() => navigate("/")} /> : <OtpForm onDone={() => navigate("/")} />}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function PasswordForm({ onDone }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier, password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
        placeholder="you@email.com or +91XXXXXXXXXX" autoFocus />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password" />
      <Alert>{error}</Alert>
      <Button type="submit" loading={busy}>Log in</Button>
    </form>
  );
}

function OtpForm({ onDone }) {
  const { verifyOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    setBusy(true);
    try {
      const res = await authService.sendOtp(phone.trim());
      setSent(true);
      setInfo(res.message); // "OTP sent via SMS" or dev-console fallback
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await verifyOtp(phone.trim(), otp.trim());
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return sent ? (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter the 6-digit code sent to <span className="font-semibold">{phone}</span>
      </p>
      <Input label="OTP code" inputMode="numeric" maxLength={6} value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456" autoFocus />
      <Alert kind="success">{info}</Alert>
      <Alert>{error}</Alert>
      <Button type="submit" loading={busy} disabled={otp.length !== 6}>Verify and log in</Button>
      <Button variant="ghost" type="button" onClick={() => { setSent(false); setOtp(""); }}>
        Change number
      </Button>
    </form>
  ) : (
    <form onSubmit={send} className="space-y-4">
      <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)}
        placeholder="+91XXXXXXXXXX" autoFocus />
      <p className="text-xs text-gray-400">Use international format starting with country code, e.g. +91</p>
      <Alert>{error}</Alert>
      <Button type="submit" loading={busy}>Send OTP</Button>
    </form>
  );
}
