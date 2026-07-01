/**
 * Browser notification helpers for streak-at-risk alerts.
 * Uses the Notifications API (no server push needed — triggered on app load).
 */

const NOTIF_STORAGE_KEY = "last_streak_notif_date";

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // SW registration is best-effort; don't block the app
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Show a streak-at-risk notification if:
 * - Permission is granted
 * - We haven't shown one today already
 * - The streak is > 0 (has something to lose)
 */
export function maybeShowStreakNotification(streakDays: number, lastActiveDate: string | null) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (streakDays <= 0) return;

  const today = new Date().toISOString().slice(0, 10);

  // Already active today — no need to warn
  if (lastActiveDate === today) return;

  // Only show once per day
  const lastShown = localStorage.getItem(NOTIF_STORAGE_KEY);
  if (lastShown === today) return;

  localStorage.setItem(NOTIF_STORAGE_KEY, today);

  new Notification("🔥 Seriyangizni yo'qotmang!", {
    body: `Sizda ${streakDays} kunlik seriya bor. Bugun ham o'qib, uni saqlab qoling!`,
    icon: "/icon-192.png",
    tag: "streak-warning",
    requireInteraction: false,
  });
}

/**
 * Schedule a daily reminder at a specific hour (local time).
 * Uses setTimeout — works as long as the tab is open.
 * hour: 0-23
 */
export function scheduleDailyReminder(hour = 19) {
  if (typeof window === "undefined") return;

  const now = new Date();
  const target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const msUntil = target.getTime() - now.getTime();
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("📚 AbituriyentAI — O'qish vaqti!", {
        body: "Bugun BMBA tayyorgarligi uchun vaqt ajratdingizmi?",
        icon: "/icon-192.png",
        tag: "daily-reminder",
      });
    }
    // Reschedule for next day
    scheduleDailyReminder(hour);
  }, msUntil);
}
