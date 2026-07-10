export default function Spinner({ full = false }) {
  const spinner = (
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
  );
  if (!full) return spinner;
  return <div className="flex min-h-screen items-center justify-center">{spinner}</div>;
}
