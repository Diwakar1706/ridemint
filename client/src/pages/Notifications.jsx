import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import Spinner from "../components/common/Spinner.jsx";
import Alert from "../components/common/Alert.jsx";
import { getSocket } from "../lib/socket.js";
import * as notificationsService from "../services/notifications.service.js";

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    notificationsService.getNotifications()
      .then(({ notifications }) => setItems(notifications))
      .catch((err) => { setError(err.message); setItems([]); });

  useEffect(() => {
    load();
    // New ones arrive over the socket in real time
    const socket = getSocket();
    const onNew = (n) => setItems((cur) => (cur ? [n, ...cur] : [n]));
    socket?.on("notification:new", onNew);
    return () => socket?.off("notification:new", onNew);
  }, []);

  const markAll = async () => {
    try { await notificationsService.markAllRead(); load(); }
    catch (err) { setError(err.message); }
  };

  const markOne = async (id) => {
    try { await notificationsService.markRead(id); load(); }
    catch (err) { setError(err.message); }
  };

  if (!items) return <AppShell><Spinner full /></AppShell>;
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm font-semibold text-brand-700 hover:underline">
            Mark all read ({unread})
          </button>
        )}
      </div>
      <div className="mt-4"><Alert>{error}</Alert></div>

      {items.length === 0 && <p className="mt-10 text-center text-gray-500">Nothing yet.</p>}

      <ul className="mt-4 space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <button onClick={() => !n.is_read && markOne(n.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left ${
                n.is_read ? "border-gray-200 bg-white" : "border-brand-200 bg-brand-50"
              }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{n.title || n.type}</p>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
              </div>
              {n.body && <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
