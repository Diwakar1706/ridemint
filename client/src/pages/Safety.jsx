import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";
import Spinner from "../components/common/Spinner.jsx";
import { getCurrentPosition } from "../hooks/useGeolocation.js";
import * as safetyService from "../services/safety.service.js";

export default function Safety() {
  const [contacts, setContacts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", relation: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const [{ contacts }, { alerts }] = await Promise.all([
        safetyService.getContacts(),
        safetyService.getMySosAlerts(),
      ]);
      setContacts(contacts);
      setAlerts(alerts);
    } catch (err) {
      setError(err.message);
      setContacts([]);
    }
  };
  useEffect(() => { load(); }, []);

  const addContact = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) return setError("Contact phone is required");
    setError(""); setBusy("contact");
    try {
      await safetyService.addContact(form);
      setForm({ name: "", phone: "", relation: "" });
      setAdding(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setBusy(""); }
  };

  // The big red button: grabs GPS and files an SOS alert
  const triggerSos = async () => {
    setError(""); setBusy("sos");
    try {
      const { lat, lng } = await getCurrentPosition();
      await safetyService.triggerSos({ lat, lng });
      load();
    } catch (err) { setError(err.message); }
    finally { setBusy(""); }
  };

  const resolve = async (id) => {
    try { await safetyService.resolveSos(id); load(); }
    catch (err) { setError(err.message); }
  };

  if (!contacts) return <AppShell><Spinner full /></AppShell>;
  const activeAlert = alerts.find((a) => a.status === "active");

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Safety</h1>
      <div className="mt-4"><Alert>{error}</Alert></div>

      {/* SOS */}
      <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          In an emergency, this records your live location as an active alert.
        </p>
        {activeAlert ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-bold text-red-700">SOS ACTIVE since {new Date(activeAlert.created_at).toLocaleTimeString()}</p>
            <Button variant="secondary" onClick={() => resolve(activeAlert.id)}>I am safe — resolve</Button>
          </div>
        ) : (
          <div className="mt-3">
            <Button variant="danger" loading={busy === "sos"} onClick={triggerSos}>
              Trigger SOS
            </Button>
          </div>
        )}
      </section>

      {/* Emergency contacts */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">Emergency contacts</h2>
      <ul className="mt-2 space-y-2">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{c.name || c.phone}</p>
              <p className="text-xs text-gray-500">{c.phone}{c.relation && ` - ${c.relation}`}</p>
            </div>
            <button onClick={() => safetyService.deleteContact(c.id).then(load)}
              className="text-sm font-semibold text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
        {contacts.length === 0 && <li className="text-sm text-gray-500">No contacts yet — add one below.</li>}
      </ul>

      {adding ? (
        <form onSubmit={addContact} className="mt-3 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91XXXXXXXXXX" />
          <Input label="Relation" value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} placeholder="mother / friend" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" type="button" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" loading={busy === "contact"}>Save contact</Button>
          </div>
        </form>
      ) : (
        <div className="mt-3"><Button variant="secondary" onClick={() => setAdding(true)}>Add contact</Button></div>
      )}
    </AppShell>
  );
}
