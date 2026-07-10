// One button component, three variants — visual consistency everywhere.
const styles = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50",
  secondary: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50",
};

export default function Button({ variant = "primary", loading = false, className = "", children, ...props }) {
  return (
    <button
      className={`flex h-12 w-full items-center justify-center rounded-xl px-4 font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        children
      )}
    </button>
  );
}
