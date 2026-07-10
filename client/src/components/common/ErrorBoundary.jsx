import { Component } from "react";

/**
 * Last line of defense: a render crash anywhere shows this screen
 * instead of a silent white page. Class component because error
 * boundaries can't be hooks (React limitation).
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crash:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-brand-700">coRide</h1>
          <p className="mt-3 font-semibold text-gray-800">Something went wrong</p>
          <p className="mt-1 text-sm text-gray-500">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 h-12 w-full rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700"
          >
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
