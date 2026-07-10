import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import Spinner from "../components/common/Spinner.jsx";
import Alert from "../components/common/Alert.jsx";
import * as routesService from "../services/routes.service.js";

export default function MyRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    routesService.getMyRoutes()
      .then(({ routes }) => setRoutes(routes))
      .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try { await routesService.toggleRoute(id); load(); }
    catch (err) { setError(err.message); }
  };

  const remove = async (id) => {
    try { await routesService.deleteRoute(id); load(); }  // soft delete → is_active=false
    catch (err) { setError(err.message); }
  };

  if (!routes) return <AppShell><Spinner full /></AppShell>;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">My Routes</h1>
      <p className="mt-1 text-sm text-gray-500">Your saved commutes and trips.</p>
      <div className="mt-4"><Alert>{error}</Alert></div>

      {routes.length === 0 && (
        <div className="mt-10 text-center text-gray-500">
          <p>No routes yet.</p>
          <button onClick={() => navigate("/")} className="mt-2 font-semibold text-brand-700 hover:underline">
            Create one from the Home map
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {routes.map((r) => (
          <li key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.origin_address || `${r.origin_lat?.toFixed(4)}, ${r.origin_lng?.toFixed(4)}`}</p>
                <p className="truncate text-sm text-gray-500">to {r.dest_address || `${r.dest_lat?.toFixed(4)}, ${r.dest_lng?.toFixed(4)}`}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                r.is_active ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-500"
              }`}>
                {r.is_active ? "Active" : "Paused"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="capitalize">{String(r.type).replace("_", " ")}</span>
              <span className="capitalize">{r.role}</span>
              {r.departure_time && <span>{String(r.departure_time).slice(0, 5)}</span>}
              {r.distance_km && <span>{r.distance_km} km</span>}
              {r.duration_min && <span>~{r.duration_min} min</span>}
            </div>

            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 text-sm font-semibold">
              <button onClick={() => navigate("/matches", { state: { routeId: r.id } })}
                className="text-brand-700 hover:underline">Find matches</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => toggle(r.id)} className="text-gray-600 hover:underline">
                {r.is_active ? "Pause" : "Resume"}
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => remove(r.id)} className="text-red-600 hover:underline">Deactivate</button>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
