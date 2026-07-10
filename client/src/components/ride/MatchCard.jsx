import Button from "../common/Button.jsx";

const metersLabel = (m) => {
  const n = Number(m);
  if (!Number.isFinite(n)) return "-";
  return n < 1000 ? `${Math.round(n)} m` : `${(n / 1000).toFixed(1)} km`;
};

/**
 * One search result: who, what vehicle, how close their route is to
 * yours, and the action. `canRequest` is true when the match is a
 * driver route (riders request drivers, not vice versa).
 */
export default function MatchCard({ match, canRequest, onRequest, requesting }) {
  const fareEstimate = match.distance_km
    ? Math.round(Number(match.distance_km) * 8.5)
    : null;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Initials avatar — consistent, no images needed */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
            {String(match.full_name || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold leading-tight">{match.full_name || "User"}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {Number(match.rating_avg || 5).toFixed(1)} rating
              {match.rating_count > 0 && ` (${match.rating_count})`}
            </p>
          </div>
        </div>
        {match.departure_time && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {String(match.departure_time).slice(0, 5)}
          </span>
        )}
      </div>

      {match.make && (
        <p className="mt-3 text-sm text-gray-600">
          {match.make} {match.model} <span className="text-gray-400">- {match.color} - {match.license_plate}</span>
        </p>
      )}

      {/* The numbers that matter: how close is their route to mine */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center">
        <div>
          <p className="text-xs text-gray-400">Pickup gap</p>
          <p className="mt-0.5 text-sm font-semibold">{metersLabel(match.origin_distance_meters)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Drop gap</p>
          <p className="mt-0.5 text-sm font-semibold">{metersLabel(match.dest_distance_meters)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{fareEstimate ? "Est. fare" : "Seats"}</p>
          <p className="mt-0.5 text-sm font-semibold">
            {fareEstimate ? `Rs ${fareEstimate}` : match.available_seats ?? "-"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        {canRequest ? (
          <Button onClick={() => onRequest(match)} loading={requesting}>
            Request ride
          </Button>
        ) : (
          <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-center text-sm text-brand-700">
            Rider going your way — they can request once they see your route
          </p>
        )}
      </div>
    </li>
  );
}
