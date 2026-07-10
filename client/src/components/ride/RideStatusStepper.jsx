// Uber-style progress stepper — always tells the user "where are we".
const STEPS = ["requested", "accepted", "in_progress", "completed"];
const LABELS = { requested: "Requested", accepted: "Accepted", in_progress: "On the way", completed: "Completed" };

export default function RideStatusStepper({ status }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
        Ride cancelled
      </div>
    );
  }

  // driver_arriving sits between accepted and in_progress
  const effective = status === "driver_arriving" ? "accepted" : status;
  const activeIdx = STEPS.indexOf(effective);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-brand-600 text-white"
                  : current ? "border-2 border-brand-600 bg-white text-brand-700"
                  : "border-2 border-gray-200 bg-white text-gray-300"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`mt-1 text-[10px] font-medium ${current ? "text-brand-700" : "text-gray-400"}`}>
                {LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 flex-1 ${done ? "bg-brand-600" : "bg-gray-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
