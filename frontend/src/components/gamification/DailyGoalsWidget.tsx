"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, BookOpen, Zap, FileText } from "lucide-react";

interface Goal {
  key: string;
  label: string;
  icon: React.ReactNode;
  xp: number;
  storageKey: string;
}

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function getGoalsDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`goals_${TODAY}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const GOALS: Goal[] = [
  {
    key: "lesson",
    label: "1 ta dars o'qi",
    icon: <BookOpen className="w-4 h-4" />,
    xp: 25,
    storageKey: "lesson",
  },
  {
    key: "drill",
    label: "10 ta kartochka yech",
    icon: <Zap className="w-4 h-4" />,
    xp: 25,
    storageKey: "drill",
  },
  {
    key: "exam",
    label: "1 ta imtihon ol",
    icon: <FileText className="w-4 h-4" />,
    xp: 25,
    storageKey: "exam",
  },
];

export function DailyGoalsWidget() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDone(getGoalsDone());
    // re-check every 30s in case user completes a goal in another tab
    const id = setInterval(() => setDone(getGoalsDone()), 30_000);
    return () => clearInterval(id);
  }, []);

  const completedCount = GOALS.filter((g) => done[g.key]).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Kunlik maqsadlar</h3>
        <span className="text-xs text-slate-500 font-medium">
          {completedCount}/{GOALS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / GOALS.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {GOALS.map((goal) => {
          const isDone = !!done[goal.key];
          return (
            <div
              key={goal.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                isDone ? "bg-emerald-50" : "bg-slate-50"
              }`}
            >
              <div className={`${isDone ? "text-emerald-500" : "text-slate-400"}`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className={`flex-1 text-sm ${isDone ? "text-emerald-700 line-through opacity-70" : "text-slate-700"}`}>
                {goal.label}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <span>+{goal.xp}</span>
                <span>XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Call this from lesson/drill/exam completion handlers to mark goals done
export function markGoalDone(goalKey: "lesson" | "drill" | "exam") {
  if (typeof window === "undefined") return;
  const storageKey = `goals_${TODAY}`;
  const current = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  })();
  current[goalKey] = true;
  localStorage.setItem(storageKey, JSON.stringify(current));
}
