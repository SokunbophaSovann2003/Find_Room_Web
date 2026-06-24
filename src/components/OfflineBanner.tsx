"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useT } from "@/lib/language";

export default function OfflineBanner() {
  const t = useT();
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setJustReconnected(true);
    }
    function handleOffline() {
      setOnline(false);
      setJustReconnected(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-hide the "Back online" toast after 3 seconds
  useEffect(() => {
    if (!justReconnected) return;
    const id = setTimeout(() => setJustReconnected(false), 3000);
    return () => clearTimeout(id);
  }, [justReconnected]);

  if (online && !justReconnected) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-0 right-0 z-[2000] flex justify-center px-4 sm:bottom-6"
    >
      {justReconnected ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          <Icon name="check" className="h-4 w-4" />
          {t("network.reconnected")}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          <Icon name="wifi-off" className="h-4 w-4 text-amber-400" />
          {t("network.offline")}
        </div>
      )}
    </div>
  );
}
