export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>}
      <input
        className={`h-12 w-full rounded-xl border bg-white px-4 outline-none transition-colors
          focus:border-brand-500 focus:ring-2 focus:ring-brand-100
          ${error ? "border-red-400" : "border-gray-300"} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}
