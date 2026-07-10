import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import MatchCard from "../components/ride/MatchCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import Alert from "../components/common/Alert.jsx";
import Button from "../components/common/Button.jsx";
import * as matchingService from "../services/matching.service.js";
import * as ridesService from "../services/rides.service.js";

/**
 * Match results. Reached two ways:
 *  - from Home with full criteria in router state
 *  - from MyRoutes with { routeId } — backend rebuilds criteria from the route
 */
export default function Matches() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState(null);

  const criteria = state?.criteria;
  const routeId = state?.routeId;
  // Riders request driver routes. If I searched as a driver, results
  // are rider routes — informational only.
  const canRequest = (criteria?.role ?? "rider") === "rider" || Boolean(routeId);

  useEffect(() => {
    if (!criteria && !routeId) return; // arrived without a search — show hint below
    const run = async () => {
      try {
        const res = routeId
          ? await matchingService.findByRoute(routeId)
          : await matchingService.searchMatches(criteria);
        setMatches(res.matches);
      } catch (err) {
        setError(err.message);
        setMatches([]);
      }
    };
    run();
  }, [criteria, routeId]);

  const requestRide = async (match) => {
    setError("");
    setRequestingId(match.id);
    try {
      // match.id IS the driver's route id (matching returns routes)
      const payload = { driverRouteId: match.id };
      if (criteria) {
        payload.pickupLat = criteria.originLat;
        payload.pickupLng = criteria.originLng;
        payload.pickupAddress = criteria.originAddress;
        payload.dropoffLat = criteria.destLat;
        payload.dropoffLng = criteria.destLng;
        payload.dropoffAddress = criteria.destAddress;
      }
      const { ride } = await ridesService.requestRide(payload);
      navigate(`/rides/${ride.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingId(null);
    }
  };

  if (!criteria && !routeId) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold">Matches</h1>
        <div className="mt-10 text-center text-gray-500">
          <p>Start a search from the Home map first.</p>
          <div className="mx-auto mt-4 max-w-xs">
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Matches</h1>
      <p className="mt-1 text-sm text-gray-500">
        People whose route overlaps yours, closest first.
      </p>
      <div className="mt-4"><Alert>{error}</Alert></div>

      {matches === null && <div className="mt-12 flex justify-center"><Spinner /></div>}

      {matches?.length === 0 && !error && (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          <p className="font-medium text-gray-700">No matches yet</p>
          <p className="mt-1 text-sm">
            Nobody is going this way at this time. Save the route from Home —
            you can subscribe to alerts and get notified when someone appears.
          </p>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {matches?.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            canRequest={canRequest && m.role === "driver"}
            onRequest={requestRide}
            requesting={requestingId === m.id}
          />
        ))}
      </ul>
    </AppShell>
  );
}
