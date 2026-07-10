import { useState } from "react";
import Button from "../common/Button.jsx";
import Alert from "../common/Alert.jsx";
import * as paymentsService from "../../services/payments.service.js";
import * as ratingsService from "../../services/ratings.service.js";

/**
 * Post-ride block for the RIDER on a completed ride:
 * 1. pay from wallet  2. rate the driver
 * Backend enforces both idempotently (409 on repeat) — the UI just
 * relays those messages if the user retries.
 */
export default function PayAndRate({ ride, myParticipant, onDone }) {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState("");
  const [score, setScore] = useState(5);
  const [review, setReview] = useState("");

  const pay = async () => {
    setError(""); setBusy("pay");
    try {
      await paymentsService.payForRide(ride.id);
      setInfo("Payment complete");
      onDone?.();
    } catch (err) {
      setError(err.message); // includes "Insufficient wallet balance" / 409
    } finally {
      setBusy("");
    }
  };

  const rate = async () => {
    setError(""); setBusy("rate");
    try {
      await ratingsService.createRating({
        rideId: ride.id,
        toUserId: ride.driver_id,
        score,
        review: review.trim() || undefined,
      });
      setInfo("Thanks for the rating");
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Finish up</p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Your fare</p>
          <p className="text-xl font-bold">Rs {myParticipant?.fare_amount ?? ride.total_fare ?? "-"}</p>
        </div>
        <div className="w-36">
          <Button loading={busy === "pay"} onClick={pay}>Pay from wallet</Button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="mb-2 text-sm font-medium text-gray-700">Rate your driver</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setScore(n)}
              className={`h-10 w-10 rounded-lg text-sm font-bold ${
                n <= score ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"
              }`}>
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Optional review"
          rows={2}
          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2">
          <Button variant="secondary" loading={busy === "rate"} onClick={rate}>Submit rating</Button>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert kind="success">{info}</Alert>
    </section>
  );
}
