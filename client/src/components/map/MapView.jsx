import { useEffect, useRef, useState } from "react";
import { loadMapplsSdk } from "../../utils/mapplsLoader.js";

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
let seq = 0; // stable unique DOM ids (React useId chars break the SDK)

/**
 * Reusable full-size Mappls map.
 * props:
 *   origin / destination: {lat,lng} → markers, auto-fit bounds
 *   onMapClick(lat,lng): tap-to-pick support
 *   children markers via `extraMarkers`: [{lat,lng,label}]
 */
export default function MapView({ origin, destination, extraMarkers = [], onMapClick, className = "" }) {
  const [mapId] = useState(() => `mappls-map-${++seq}`);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clickRef = useRef(onMapClick);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  clickRef.current = onMapClick; // always call the latest handler

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    loadMapplsSdk()
      .then((mappls) => {
        if (cancelled) return;
        const map = new mappls.Map(mapId, {
          center: origin || DEFAULT_CENTER,
          zoom: 12,
        });
        mapRef.current = map;
        map.on?.("click", (e) => {
          const lat = e?.lngLat?.lat ?? e?.latlng?.lat;
          const lng = e?.lngLat?.lng ?? e?.latlng?.lng;
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            clickRef.current?.(lat, lng);
          }
        });
        setReady(true);
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m?.remove?.());
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Sync markers whenever positions change
  useEffect(() => {
    const map = mapRef.current;
    const mappls = window.mappls;
    if (!ready || !map || !mappls) return;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const points = [];
    if (origin) points.push({ ...origin, label: "Pickup" });
    if (destination) points.push({ ...destination, label: "Drop" });
    for (const m of extraMarkers) points.push(m);

    for (const p of points) {
      markersRef.current.push(
        new mappls.Marker({
          map,
          position: { lat: p.lat, lng: p.lng },
          popupHtml: p.label ? `<b>${p.label}</b>` : undefined,
        }),
      );
    }

    if (points.length >= 2 && typeof map.fitBounds === "function") {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, duration: 400 },
      );
    } else if (points.length === 1) {
      map.setCenter?.({ lat: points[0].lat, lng: points[0].lng });
    }
  }, [ready, origin, destination, extraMarkers]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div id={mapId} className="h-full w-full" />
      {error && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
