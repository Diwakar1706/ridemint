import { api, call } from "../lib/api.js";

export const getMyRides = (params = {}) =>
  call(api.get("/rides/my", { params }));
export const getRide = (id) => call(api.get(`/rides/${id}`));
export const requestRide = (payload) => call(api.post("/rides/request", payload));
export const acceptRide = (id) => call(api.post(`/rides/${id}/accept`));
export const rejectRide = (id) => call(api.post(`/rides/${id}/reject`));
export const cancelRide = (id) => call(api.post(`/rides/${id}/cancel`));
export const startRide = (id) => call(api.post(`/rides/${id}/start`));
export const completeRide = (id) => call(api.post(`/rides/${id}/complete`));
export const pickupParticipant = (rideId, participantId) =>
  call(api.post(`/rides/${rideId}/pickup/${participantId}`));
export const dropoffParticipant = (rideId, participantId) =>
  call(api.post(`/rides/${rideId}/dropoff/${participantId}`));
export const shareLiveLocation = (rideId, payload) =>
  call(api.post(`/rides/${rideId}/live-location`, payload));
export const getLiveLocations = (rideId) =>
  call(api.get(`/rides/${rideId}/live-locations`));
