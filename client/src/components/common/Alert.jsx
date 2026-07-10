// Inline error/success message under forms
export default function Alert({ kind = "error", children }) {
  if (!children) return null;
  const styles = kind === "error"
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-brand-50 text-brand-700 border-brand-100";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
  );
}
