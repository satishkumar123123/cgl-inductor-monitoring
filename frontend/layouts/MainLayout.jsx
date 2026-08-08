import React from "react";
import Navbar from "../components/Navbar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />
      <main className="w-full px-4 sm:px-6 py-6 bg-white">
        <div className="max-w-[1700px] mx-auto">{children}</div>
      </main>
    </div>
  );
}