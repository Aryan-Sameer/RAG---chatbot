import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { API_BASE } from "../config";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-500/20 text-indigo-200"
      : "text-stone-300 hover:text-white hover:bg-white/10"
  }`;

export default function Navbar() {
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (!cancelled) {
          setHealth(res.ok ? "online" : "offline");
        }
      } catch {
        if (!cancelled) setHealth("offline");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const healthLabel =
    health === "online" ? "connected" : health === "offline" ? "offline" : "connecting…";
  const healthColor =
    health === "online"
      ? "bg-emerald-400"
      : health === "offline"
        ? "bg-red-400"
        : "bg-amber-400";

  return (
    <header className="shrink-0 border-b border-stone-800 bg-stone-950 text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold">
            V
          </span>
          <div className="leading-tight">
            <span className="font-semibold tracking-tight">VNRGPT</span>
            <span className="hidden text-xs text-stone-400 sm:block">Campus Assistant</span>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={linkClass} end>
            Chat
          </NavLink>
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className={`h-2 w-2 rounded-full ${healthColor}`} aria-hidden />
          <span className="hidden sm:inline">{healthLabel}</span>
        </div>
      </div>
    </header>
  );
}
