import { NavLink, Link } from "react-router-dom";

// Minimal inline SVG icons — no emoji, no icon library.
const icons = {
  home: <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-10.5Z" />,
  rides: <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4h2m14-6a2 2 0 0 1 2 2v4h-2m-1 0a1.5 1.5 0 1 1-3 0m-7 0a1.5 1.5 0 1 1-3 0m3 0h7" />,
  routes: <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15V9a4 4 0 0 1 4-4h1m7 4v6a4 4 0 0 1-4 4h-1" />,
  wallet: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M16 14h2" />,
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
};

const tabs = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/rides", label: "Rides", icon: "rides" },
  { to: "/routes", label: "Routes", icon: "routes" },
  { to: "/wallet", label: "Wallet", icon: "wallet" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

export default function TopNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="relative flex h-14 w-full items-center justify-center px-4">
        {/* Brand — pinned to the far left edge */}
        <Link to="/" className="absolute left-4 text-xl font-bold tracking-tight text-brand-700">
          coRide
        </Link>

        {/* Tabs — centered */}
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium sm:flex-row sm:gap-1.5 sm:text-sm ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                {icons[t.icon]}
              </svg>
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
