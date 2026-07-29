import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-industrial-bg text-slate-200 flex flex-col items-center justify-center gap-4 px-4">
      <AlertTriangle size={40} className="text-orange-400" />
      <h1 className="text-2xl font-extrabold text-white">404 — Page Not Found</h1>
      <p className="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="mt-2 toolbar-btn-primary">Back to Dashboard</Link>
    </div>
  );
}
