import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Alert from "../components/common/Alert.jsx";
import Spinner from "../components/common/Spinner.jsx";
import * as vehiclesService from "../services/vehicles.service.js";

const EMPTY = { vehicleType: "car", make: "", model: "", color: "", licensePlate: "", totalSeats: 4 };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    vehiclesService.getMyVehicles()
      .then(({ vehicles }) => setVehicles(vehicles))
      .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await vehiclesService.addVehicle({ ...form, totalSeats: Number(form.totalSeats) });
      setForm(EMPTY);
      setAdding(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try { await vehiclesService.deleteVehicle(id); load(); }
    catch (err) { setError(err.message); }
  };

  if (!vehicles) return <AppShell><Spinner full /></AppShell>;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">My Vehicles</h1>
      <p className="mt-1 text-sm text-gray-500">Needed when you publish a route as a driver.</p>
      <div className="mt-4"><Alert>{error}</Alert></div>

      <ul className="mt-4 space-y-3">
        {vehicles.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold">{v.make} {v.model} <span className="text-gray-400">({v.color})</span></p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">{v.license_plate} - {v.vehicle_type} - {v.total_seats} seats</p>
            </div>
            <button onClick={() => remove(v.id)} className="text-sm font-semibold text-red-600 hover:underline">Remove</button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Type</span>
              <select value={form.vehicleType} onChange={set("vehicleType")}
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3">
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
              </select>
            </label>
            <Input label="Seats" type="number" min="1" max="7" value={form.totalSeats} onChange={set("totalSeats")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Make" value={form.make} onChange={set("make")} placeholder="Maruti" />
            <Input label="Model" value={form.model} onChange={set("model")} placeholder="Swift" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Color" value={form.color} onChange={set("color")} placeholder="White" />
            <Input label="Plate" value={form.licensePlate} onChange={set("licensePlate")} placeholder="KA01AB1234" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" loading={busy}>Add vehicle</Button>
          </div>
        </form>
      ) : (
        <div className="mt-5">
          <Button onClick={() => setAdding(true)}>Add a vehicle</Button>
        </div>
      )}
    </AppShell>
  );
}
