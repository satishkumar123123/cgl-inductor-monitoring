import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

/**
 * Top-level render error catcher. Without this, an uncaught error in any
 * page would blank the entire app with no way back except a hard refresh —
 * this shows a friendly recovery screen instead.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-industrial-bg text-slate-200 flex flex-col items-center justify-center gap-4 px-4">
          <AlertOctagon size={40} className="text-red-400" />
          <h1 className="text-xl font-extrabold text-white">Something went wrong</h1>
          <p className="text-sm text-slate-500 max-w-md text-center">
            An unexpected error occurred while rendering this page. You can go back to the dashboard and try again —
            if it keeps happening, use the browser console for details or contact your administrator.
          </p>
          <button onClick={this.handleReset} className="toolbar-btn-primary">
            <RotateCcw size={14} /> Back to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
