import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import MapView from "../components/map/MapView.jsx";
import RideStatusStepper from "../components/ride/RideStatusStepper.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";
import Spinner from "../components/common/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLiveRide } from "../hooks/useLiveRide.js";
import { watchPosition } from "../hooks/useGeolocation.js";
import * as ridesService from "../services/rides.service.js";
import PayAndRate from "../components/ride/PayAndRate.jsx";

const LIVE_STATUSES = ["accepted", "driver_arriving", "in_progress"];
const SHARE_INTERVAL_MS = 5000;

export default function RideDetail() {
  const { id: rideId } = useParams();
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(
    () => ridesService.getRide(rideId).then(({ ride }) => setRide(ride)).catch((e) => setError(e.message)),
    [rideId],
  );
  useEffect(() => { load(); }, [load]);

  const isDriver = ride?.driver_id === user.id;
  const isLive = LIVE_STATUSES.includes(ride?.status);
  const liveLocations = useLiveRide(rideId, isLive);

  // --- share MY position while the ride is live (write via REST,
  // the backend pushes it to everyone else over the socket) ---
  const lastSentRef = useRef(0);
  useEffect(() => {
    if (!isLive) return;
    const stop = watchPosition((pos) => {
      const now = Date.now();
      if (now - lastSentRef.current < SHARE_INTERVAL_MS) return; // throttle
      lastSentRef.current = now;
      ridesService.shareLiveLocation(rideId, pos).catch(() => {});
    });
    return stop;
  }, [isLive, rideId]);

  // Any lifecycle action: run it, then refetch the ride
  const act = async (name, fn) => {
    setError("");
    setBusy(name);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const liveMarkers = useMemo(
    () =>
      Object.values(liveLocations)
        .filter((l) => Number.isFinite(Number(l.lat)))
        .map((l) => ({
          lat: Number(l.lat),
          lng: Number(l.lng),
          label: `${l.full_name || "User"} (${l.role})${l.eta_min ? ` - ETA ${l.eta_min} min` : ""}`,
        })),
    [liveLocations],
  );

  if (!ride) return <AppShell>{error ? <Alert>{error}</Alert> : <Spinner full />}</AppShell>;

  const pendingParticipants = ride.participants?.filter((p) => !["cancelled", "no_show"].includes(p.status)) || [];

  return (
    <AppShell padded={false}>
      {/* Live map on top */}
      <div className="h-72 w-full">
        <MapView extraMarkers={liveMarkers} />
      </div>

      <div className="space-y-4 px-4 pb-24 pt-4">
        <RideStatusStepper status={ride.status} />
        <Alert>{error}</Alert>

        {isLive && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-center text-xs font-medium text-brand-700">
            Sharing your live location with this ride
            {liveMarkers.length > 0 && ` - ${liveMarkers.length} live on the map`}
          </p>
        )}

        {/* Who's driving */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Driver</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-semibold">{ride.driver_name}{isDriver && " (you)"}</p>
              <p className="text-sm text-gray-500">
                {ride.vehicle_make} {ride.vehicle_model} - {ride.vehicle_color} - {ride.license_plate}
              </p>
            </div>
            <span className="text-sm text-gray-500">{Number(ride.driver_rating || 5).toFixed(1)} rating</span>
          </div>
        </section>

        {/* Riders + per-rider driver controls */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Riders</p>
          <ul className="mt-2 space-y-3">
            {pendingParticipants.map((p) => (
              <li key={p.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {p.rider_name}{p.rider_id === user.id && " (you)"}
                  </p>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                    {String(p.status).replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{p.pickup_address} to {p.dropoff_address}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.segment_distance_km} km - Rs {p.fare_amount}
                </p>

                {isDriver && ride.status === "in_progress" && ["pending", "confirmed"].includes(p.status) && (
                  <div className="mt-2">
                    <Button loading={busy === `pickup-${p.id}`}
                      onClick={() => act(`pickup-${p.id}`, () => ridesService.pickupParticipant(ride.id, p.id))}>
                      Mark picked up
                    </Button>
                  </div>
                )}
                {isDriver && p.status === "picked_up" && (
                  <div className="mt-2">
                    <Button variant="secondary" loading={busy === `dropoff-${p.id}`}
                      onClick={() => act(`dropoff-${p.id}`, () => ridesService.dropoffParticipant(ride.id, p.id))}>
                      Mark dropped off
                    </Button>
                  </div>
                )}
              </li>
            ))}
            {pendingParticipants.length === 0 && (
              <li className="text-sm text-gray-500">No riders yet.</li>
            )}
          </ul>
        </section>

        {/* Lifecycle actions by role + status */}
        <section className="space-y-2">
          {isDriver && ride.status === "requested" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="danger" loading={busy === "reject"}
                onClick={() => act("reject", () => ridesService.rejectRide(ride.id))}>
                Reject
              </Button>
              <Button loading={busy === "accept"}
                onClick={() => act("accept", () => ridesService.acceptRide(ride.id))}>
                Accept ride
              </Button>
            </div>
          )}
          {isDriver && ["accepted", "driver_arriving"].includes(ride.status) && (
            <Button loading={busy === "start"}
              onClick={() => act("start", () => ridesService.startRide(ride.id))}>
              Start ride
            </Button>
          )}
          {isDriver && ride.status === "in_progress" && (
            <Button loading={busy === "complete"}
              onClick={() => act("complete", () => ridesService.completeRide(ride.id))}>
              Complete ride
            </Button>
          )}
          {!isDriver && ["requested", "accepted"].includes(ride.status) && (
            <Button variant="danger" loading={busy === "cancel"}
              onClick={() => act("cancel", () => ridesService.cancelRide(ride.id))}>
              Cancel request
            </Button>
          )}
          {ride.status === "completed" && !isDriver && (
            <PayAndRate
              ride={ride}
              myParticipant={ride.participants?.find((p) => p.rider_id === user.id)}
              onDone={load}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
