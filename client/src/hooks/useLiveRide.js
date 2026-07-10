import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket.js";
import * as ridesService from "../services/rides.service.js";

/**
 * Live positions of everyone in a ride, as { [userId]: location }.
 * Socket push is the fast path; a 15s poll is the safety net
 * (sockets drop on flaky networks — the REST data is source of truth).
 */
export function useLiveRide(rideId, active) {
  const [locations, setLocations] = useState({});

  useEffect(() => {
    if (!rideId || !active) return;

    const applyList = ({ locations }) =>
      setLocations(Object.fromEntries(locations.map((l) => [l.user_id, l])));

    ridesService.getLiveLocations(rideId).then(applyList).catch(() => {});

    const socket = getSocket();
    const onPush = (payload) => {
      if (payload?.rideId !== rideId || !payload.location) return;
      setLocations((cur) => ({ ...cur, [payload.location.user_id]: payload.location }));
    };
    socket?.on("ride:live_location", onPush);

    const poll = setInterval(
      () => ridesService.getLiveLocations(rideId).then(applyList).catch(() => {}),
      15000,
    );

    return () => {
      socket?.off("ride:live_location", onPush);
      clearInterval(poll);
    };
  }, [rideId, active]);

  return locations;
}
