import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import MapView from "../components/map/MapView.jsx";
import PlaceSearch from "../components/map/PlaceSearch.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";
import { reverseGeocode } from "../services/geocode.service.js";
import { getCurrentPosition } from "../hooks/useGeolocation.js";
import * as routesService from "../services/routes.service.js";
import * as vehiclesService from "../services/vehicles.service.js";

const WEEKDAYS = [
  { n: 1, label: "M" }, { n: 2, label: "T" }, { n: 3, label: "W" },
  { n: 4, label: "T" }, { n: 5, label: "F" }, { n: 6, label: "S" }, { n: 7, label: "S" },
];

// THE map-first home screen: pick origin + destination (search or tap),
// choose role/type/time, then save the route and/or search matches.
export default function Home() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);        // {lat,lng,address}
  const [destination, setDestination] = useState(null);
  const [tapTarget, setTapTarget] = useState(null);  // which field a map tap fills
  const [role, setRole] = useState("rider");
  const [type, setType] = useState("one_time");
  const [departureTime, setDepartureTime] = useState("09:00");
  const [seats, setSeats] = useState(1);
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);

  // Drivers need a vehicle on the route — load theirs once
  useEffect(() => {
    vehiclesService.getMyVehicles()
      .then(({ vehicles }) => {
        setVehicles(vehicles);
        if (vehicles[0]) setVehicleId(vehicles[0].id);
      })
      .catch(() => {});
  }, []);

  // Map tap fills whichever field the user armed with "Pick on map"
  const onMapClick = async (lat, lng) => {
    if (!tapTarget) return;
    const address = await reverseGeocode(lat, lng);
    const point = { lat, lng, address };
    if (tapTarget === "origin") setOrigin(point);
    else setDestination(point);
    setTapTarget(null);
  };

  // Fill Pickup from the device GPS (works on localhost/https only)
  const useMyLocation = async () => {
    setError("");
    setLocating(true);
    try {
      const { lat, lng } = await getCurrentPosition();
      const address = await reverseGeocode(lat, lng);
      setOrigin({ lat, lng, address });
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const buildPayload = () => ({
    originLat: origin.lat,
    originLng: origin.lng,
    originAddress: origin.address,
    destLat: destination.lat,
    destLng: destination.lng,
    destAddress: destination.address,
    type,
    role,
    departureTime,
    timeFlexMin: 30,
    ...(type === "recurring" ? { recurringDays: days } : {}),
    ...(role === "driver" ? { vehicleId, availableSeats: Number(seats) } : {}),
  });

  const validate = () => {
    if (!origin || !destination) return "Set both pickup and drop points";
    if (role === "driver" && !vehicleId) return "Add a vehicle first (Profile > Vehicles)";
    if (type === "recurring" && days.length === 0) return "Pick at least one day";
    return "";
  };

  const saveRoute = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(""); setInfo(""); setBusy(true);
    try {
      await routesService.createRoute(buildPayload());
      setInfo("Route saved. You can manage it in Routes.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const findMatches = () => {
    const problem = validate();
    if (problem) return setError(problem);
    // Criteria travel via router state → Matches page runs the search
    navigate("/matches", { state: { criteria: buildPayload() } });
  };

  return (
    <AppShell padded={false}>
      {/* Full-screen map */}
      <div className="fixed inset-0 top-14">
        <MapView origin={origin} destination={destination} onMapClick={onMapClick} />
      </div>

      {/* Floating search card */}
      <div className="pointer-events-none fixed inset-x-0 top-14 z-20">
        <div className="mx-auto max-w-md px-4 pt-4">
          <div className="pointer-events-auto space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <PlaceSearch label="Pickup" value={origin} onSelect={setOrigin} placeholder="Search pickup point" />
              </div>
              <button
                onClick={() => setTapTarget(tapTarget === "origin" ? null : "origin")}
                className={`h-11 rounded-lg border px-3 text-xs font-semibold ${
                  tapTarget === "origin" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-500"
                }`}
              >
                Map
              </button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <PlaceSearch label="Drop" value={destination} onSelect={setDestination} placeholder="Search drop point" />
              </div>
              <button
                onClick={() => setTapTarget(tapTarget === "destination" ? null : "destination")}
                className={`h-11 rounded-lg border px-3 text-xs font-semibold ${
                  tapTarget === "destination" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-500"
                }`}
              >
                Map
              </button>
            </div>
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              {locating ? "Locating..." : "Use my current location as pickup"}
            </button>
            {tapTarget && (
              <p className="text-xs font-medium text-brand-700">
                Tap anywhere on the map to set the {tapTarget === "origin" ? "pickup" : "drop"} point
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sheet: trip options */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-md px-4 pb-3">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
            <button
              onClick={() => setSheetOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
            >
              Trip options
              <span className="text-gray-400">{sheetOpen ? "Hide" : "Show"}</span>
            </button>

            {sheetOpen && (
              <div className="space-y-4 border-t border-gray-100 px-4 py-4">
                {/* Role: am I driving or riding? */}
                <div className="grid grid-cols-2 gap-2">
                  {["rider", "driver"].map((r) => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`h-11 rounded-xl border text-sm font-semibold capitalize ${
                        role === r ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"
                      }`}>
                      {r === "rider" ? "I need a ride" : "I am driving"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Trip type</span>
                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                      <option value="one_time">One time</option>
                      <option value="recurring">Daily commute</option>
                      <option value="instant">Leaving now</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Departure</span>
                    <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm" />
                  </label>
                </div>

                {type === "recurring" && (
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Days</span>
                    <div className="flex gap-1.5">
                      {WEEKDAYS.map((d) => (
                        <button key={d.n}
                          onClick={() => setDays((cur) => cur.includes(d.n) ? cur.filter((x) => x !== d.n) : [...cur, d.n])}
                          className={`h-9 w-9 rounded-full text-sm font-semibold ${
                            days.includes(d.n) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {role === "driver" && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Vehicle</span>
                      <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                        {vehicles.length === 0 && <option value="">No vehicles yet</option>}
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Seats</span>
                      <input type="number" min="1" max="6" value={seats} onChange={(e) => setSeats(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm" />
                    </label>
                  </div>
                )}

                <Alert>{error}</Alert>
                <Alert kind="success">{info}</Alert>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={saveRoute} loading={busy}>Save route</Button>
                  <Button onClick={findMatches}>Find matches</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
