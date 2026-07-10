import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-200">404</p>
        <p className="mt-3 font-semibold text-gray-800">This page does not exist</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-brand-700 hover:underline">
          Back to the map
        </Link>
      </div>
    </div>
  );
}
