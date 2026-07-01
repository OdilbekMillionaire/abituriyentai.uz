"use client";

import { CheckCircle, Circle, Target } from "lucide-react";
import { useDailyCheckin } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang";

interface DailyQuestProps {
  streakDays: number;
  lessonsCompletedToday?: number;
  examsTakenToday?: number;
  className?: string;
}

const QUESTS = [
  { id: "complete_lesson", trKey: "quest_lesson", xp_reward: 25, coin_reward: 0,  icon: "📚" },
  { id: "take_exam",       trKey: "quest_exam",   xp_reward: 50, coin_reward: 5,  icon: "📝" },
  { id: "streak_3",        trKey: "quest_streak3",xp_reward: 0,  coin_reward: 10, icon: "🔥" },
];

export function DailyQuest({
  streakDays,
  lessonsCompletedToday = 0,
  examsTakenToday = 0,
  className,
}: DailyQuestProps) {
  const { tr } = useLang();
  const dailyCheckin = useDailyCheckin();

  const questStatus: Record<string, boolean> = {
    complete_lesson: lessonsCompletedToday >= 1,
    take_exam:       examsTakenToday >= 1,
    streak_3:        streakDays >= 3,
  };

  const completedCount = Object.values(questStatus).filter(Boolean).length;
  const allDone = completedCount === QUESTS.length;

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          {tr("daily_quest")}
        </h3>
        <span className={cn(
          "text-sm font-bold px-2.5 py-1 rounded-full",
          allDone ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
        )}>
          {completedCount}/{QUESTS.length}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {QUESTS.map((quest) => {
          const isDone = questStatus[quest.id] ?? false;
          const progress =
            quest.id === "complete_lesson" ? Math.min(lessonsCompletedToday, 1) :
            quest.id === "take_exam"       ? Math.min(examsTakenToday, 1) :
            Math.min(streakDays, 3);
          const required = quest.id === "streak_3" ? 3 : 1;

          return (
            <div
              key={quest.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                isDone ? "bg-green-50 border border-green-100" : "bg-slate-50 border border-slate-100"
              )}
            >
              <div className="text-xl flex-shrink-0">{quest.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isDone ? "text-green-700 line-through" : "text-slate-700"
                )}>
                  {tr(quest.trKey)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isDone ? "bg-green-400" : "bg-blue-400"
                      )}
                      style={{ width: `${(progress / required) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {progress}/{required}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {quest.xp_reward > 0 && (
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded">
                    🪙 +{quest.xp_reward} {tr("xp_tanga")}
                  </span>
                )}
                {quest.coin_reward > 0 && (
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded">
                    +{quest.coin_reward} 🪙
                  </span>
                )}
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Check-in Button */}
      <button
        onClick={() => dailyCheckin.mutate()}
        disabled={dailyCheckin.isPending || dailyCheckin.isSuccess}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
          dailyCheckin.isSuccess
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        )}
      >
        {dailyCheckin.isPending
          ? tr("checkin_loading")
          : dailyCheckin.isSuccess
          ? tr("checkin_done")
          : tr("checkin_btn")}
      </button>
    </div>
  );
}
