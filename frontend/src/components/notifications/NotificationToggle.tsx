"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleDailyReminder,
  registerServiceWorker,
} from "@/lib/notifications";
import { useLang } from "@/lib/lang";

export function NotificationToggle() {
  const { tr } = useLang();
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
    registerServiceWorker();
  }, []);

  if (permission === "unsupported") return null;

  async function handleEnable() {
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleDailyReminder(19);
      setPermission("granted");
    } else {
      setPermission("denied");
    }
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
        <Bell className="w-3.5 h-3.5" />
        {tr("notif_on")}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <BellOff className="w-3.5 h-3.5" />
        {tr("notif_blocked")}
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-200 transition-colors"
    >
      <Bell className="w-3.5 h-3.5" />
      {tr("notif_enable")}
    </button>
  );
}
