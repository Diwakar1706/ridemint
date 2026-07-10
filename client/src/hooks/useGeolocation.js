// Promise wrapper around the browser's GPS.
// Works on localhost and https only (browser security rule).
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("This browser has no geolocation support"));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(new Error(
        err.code === 1
          ? "Location permission denied — allow it in the browser address bar"
          : "Could not get your location",
      )),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

// Continuous tracking (used in F5 for live rides).
// Returns a stop() function.
export const watchPosition = (onUpdate, onError) => {
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speedKmph: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
      heading: pos.coords.heading,
    }),
    (err) => onError?.(err),
    { enableHighAccuracy: true, maximumAge: 3000 },
  );
  return () => navigator.geolocation.clearWatch(id);
};
