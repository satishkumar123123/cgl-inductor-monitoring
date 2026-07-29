import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function MainLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-industrial-bg text-slate-200">
      <Navbar onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex">
        <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div className="max-w-[1500px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
