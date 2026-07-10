import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../../services/geocode.service.js";

/**
 * Address input with debounced suggestions.
 * onSelect({lat, lng, address}) fires when the user picks one.
 */
export default function PlaceSearch({ label, value, onSelect, placeholder }) {
  const [text, setText] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  // Keep the input in sync when the value is set from outside (map tap)
  useEffect(() => setText(value?.address || ""), [value]);

  const onChange = (e) => {
    const q = e.target.value;
    setText(q);
    clearTimeout(timer.current);
    if (q.trim().length < 3) return setResults([]);
    // debounce: wait for the user to stop typing (privacy + rate limits)
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(q));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const pick = (r) => {
    onSelect(r);
    setText(r.address);
    setOpen(false);
  };

  return (
    <div className="relative">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <input
        value={text}
        onChange={onChange}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {searching && (
        <span className="absolute right-3 top-9 h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => pick(r)}
                className="block w-full truncate px-3 py-2.5 text-left text-sm hover:bg-brand-50"
              >
                {r.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
