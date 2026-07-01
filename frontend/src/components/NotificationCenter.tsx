"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";

interface AppNotification {
  id: string;
  type: "streak" | "weak_area" | "tip";
  message: string;
  createdAt: string; // ISO date string
  read: boolean;
}

const STORAGE_KEY = "app_notifications";
const TODAY = new Date().toISOString().slice(0, 10);

function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function generateNotifications(profile: { streak_days?: number; last_active_date?: string | null } | null): AppNotification[] {
  const notifications: AppNotification[] = [];

  if (profile) {
    // Check streak
    if (!profile.last_active_date || profile.last_active_date.slice(0, 10) !== TODAY) {
      notifications.push({
        id: `streak_${TODAY}`,
        type: "streak",
        message: "🔥 Bugun streak saqlang! Kunlik kirishni amalga oshiring.",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }

  return notifications;
}

interface NotificationCenterProps {
  profile?: { streak_days?: number; last_active_date?: string | null } | null;
}

export function NotificationCenter({ profile }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadNotifications();
    const generated = generateNotifications(profile ?? null);

    // Merge: keep stored, add newly generated that aren't already there
    const storedIds = new Set(stored.map((n) => n.id));
    const merged = [...stored, ...generated.filter((n) => !storedIds.has(n.id))];
    // Keep only last 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const filtered = merged.filter((n) => n.createdAt >= cutoff);
    setNotifications(filtered);
    saveNotifications(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  }

  function dismiss(id: string) {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        title="Bildirishnomalar"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Bildirishnomalar</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Bildirishnomalar yo&apos;q
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.read ? "" : "bg-blue-50"}`}>
                  <p className="text-sm text-slate-700 flex-1 leading-snug">{n.message}</p>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="text-slate-300 hover:text-slate-500 mt-0.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
