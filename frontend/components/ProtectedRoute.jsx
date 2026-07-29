import React from "react";

export default function ProtectedRoute({ children }) {
  // Direct access without login check or redirect
  return children;
}