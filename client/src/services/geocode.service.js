// Address search via OpenStreetMap Nominatim — free, no API key.
// Fine for dev/MVP volume; swap for Mappls/Google geocoding at scale.
const BASE = "https://nominatim.openstreetmap.org";

export const searchPlaces = async (query, limit = 5) => {
  const q = String(query || "").trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: String(limit),
    countrycodes: "in",          // bias to India — adjust when going global
  });

  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error(`Address search failed (${res.status})`);

  const data = await res.json();
  return data
    .map((item) => ({
      lat: Number(item.lat),
      lng: Number(item.lon),
      address: String(item.display_name || "").trim(),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.address);
};

// Coordinates → human-readable address (for map taps)
export const reverseGeocode = async (lat, lng) => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "json" });
  const res = await fetch(`${BASE}/reverse?${params}`, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};
