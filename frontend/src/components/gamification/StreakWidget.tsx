"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang";

interface StreakWidgetProps {
  streakDays: number;
  coins: number;
  oxforderTanga?: number;
  className?: string;
}

export function StreakWidget({ streakDays, coins, oxforderTanga = 0, className }: StreakWidgetProps) {
  const { tr } = useLang();
  const isActive = streakDays > 0;
  const isOnFire = streakDays >= 3;

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5", className)}>
      <h3 className="text-sm font-semibold text-slate-500 mb-4">{tr("streak_title")}</h3>

      {/* Streak */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          isOnFire ? "bg-orange-100" : isActive ? "bg-yellow-100" : "bg-slate-100"
        )}>
          <Flame className={cn(
            "w-7 h-7",
            isOnFire ? "text-orange-500" : isActive ? "text-yellow-500" : "text-slate-300"
          )} />
        </div>
        <div>
          <div className={cn(
            "text-3xl font-bold",
            isOnFire ? "text-orange-600" : isActive ? "text-yellow-600" : "text-slate-300"
          )}>
            {streakDays}
          </div>
          <div className="text-xs text-slate-500">
            {streakDays === 0
              ? tr("streak_none")
              : `${streakDays} ${tr("streak_day")}`}
          </div>
        </div>
      </div>

      {/* Mini streak calendar (last 7 days) */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 7 }).map((_, i) => {
          const active = i >= 7 - streakDays && streakDays > 0;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 h-2 rounded-full",
                active ? "bg-orange-400" : "bg-slate-100"
              )}
            />
          );
        })}
      </div>

      {/* Coins */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🪙</span>
            <div>
              <div className="text-sm font-bold text-yellow-600">{coins}</div>
              <div className="text-xs text-slate-400">Tanga</div>
            </div>
          </div>
          {oxforderTanga > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔷</span>
              <div>
                <div className="text-sm font-bold text-violet-600">{oxforderTanga}</div>
                <div className="text-xs text-slate-400">O.Tanga</div>
              </div>
            </div>
          )}
        </div>
        {isOnFire && (
          <div className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-full">
            🔥 {tr("streak_bonus")}
          </div>
        )}
      </div>
    </div>
  );
}
