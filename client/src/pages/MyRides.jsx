import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import Spinner from "../components/common/Spinner.jsx";
import Alert from "../components/common/Alert.jsx";
import * as ridesService from "../services/rides.service.js";

const STATUS_STYLE = {
  requested: "bg-amber-50 text-amber-700",
  accepted: "bg-blue-50 text-blue-700",
  driver_arriving: "bg-blue-50 text-blue-700",
  in_progress: "bg-brand-50 text-brand-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-600",
};

// The driver's inbox: incoming requests land here as "requested".
export default function MyRides() {
  const [filter, setFilter] = useState("all"); // all | driver | rider
  const [rides, setRides] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setRides(null);
    const params = filter === "all" ? {} : { role: filter };
    ridesService.getMyRides(params)
      .then(({ rides }) => setRides(rides))
      .catch((err) => { setError(err.message); setRides([]); });
  }, [filter]);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">My Rides</h1>
      <p className="mt-1 text-sm text-gray-500">Requests you sent and rides you drive.</p>

      <div className="mt-4 grid grid-cols-3 rounded-xl bg-gray-100 p-1 text-sm font-medium">
        {["all", "driver", "rider"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`h-9 rounded-lg capitalize transition-colors ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}>
            {f === "all" ? "All" : `As ${f}`}
          </button>
        ))}
      </div>

      <div className="mt-4"><Alert>{error}</Alert></div>
      {rides === null && <div className="mt-12 flex justify-center"><Spinner /></div>}

      {rides?.length === 0 && !error && (
        <p className="mt-10 text-center text-gray-500">No rides here yet.</p>
      )}

      <ul className="mt-4 space-y-3">
        {rides?.map((r) => (
          <li key={r.id}>
            <Link to={`/rides/${r.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {new Date(r.created_at).toLocaleString(undefined, {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[r.status] || ""}`}>
                  {String(r.status).replace("_", " ")}
                </span>
              </div>
              {r.total_fare && (
                <p className="mt-1 text-xs text-gray-500">Fare Rs {r.total_fare}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Tap to open live view and actions</p>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
