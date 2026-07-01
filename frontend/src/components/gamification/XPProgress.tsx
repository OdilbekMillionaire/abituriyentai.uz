"use client";

import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang";

interface XPProgressProps {
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  className?: string;
}

const LEVEL_KEYS: Record<number, string> = {
  1: "level_1", 2: "level_2", 3: "level_3", 4: "level_4", 5: "level_5",
  6: "level_6", 7: "level_7", 8: "level_8", 9: "level_9", 10: "level_10",
};

function getLevelBadgeColor(level: number): string {
  if (level >= 10) return "from-yellow-400 to-orange-500";
  if (level >= 7)  return "from-purple-500 to-indigo-600";
  if (level >= 5)  return "from-blue-500 to-cyan-600";
  if (level >= 3)  return "from-green-400 to-teal-500";
  return "from-slate-400 to-slate-500";
}

export function XPProgress({
  xp,
  level,
  xpInCurrentLevel,
  xpToNextLevel,
  className,
}: XPProgressProps) {
  const { tr } = useLang();
  const progressPercent = (xpInCurrentLevel / (xpInCurrentLevel + xpToNextLevel)) * 100;

  function getLevelTitle(lvl: number): string {
    const key = LEVEL_KEYS[lvl];
    if (key) return tr(key);
    return lvl > 10 ? tr("level_legend") : tr("level_1");
  }

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500">{tr("xp_title")}</h3>
        <div className="flex items-center gap-1.5 text-yellow-600">
          <span className="text-base">🪙</span>
          <span className="text-sm font-bold">{xp.toLocaleString()} {tr("xp_tanga")}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {/* Level badge */}
        <div className={cn(
          "w-16 h-16 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center flex-shrink-0 shadow-sm",
          getLevelBadgeColor(level)
        )}>
          <span className="text-white font-black text-2xl leading-none">{level}</span>
          <span className="text-white/80 text-xs leading-none">{tr("xp_level_label")}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-bold text-slate-900">{getLevelTitle(level)}</span>
            <span className="text-xs text-slate-400">
              {xpInCurrentLevel} / {xpInCurrentLevel + xpToNextLevel} {tr("xp_tanga")}
            </span>
          </div>
          {/* XP progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                getLevelBadgeColor(level)
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {level + 1}-{tr("xp_level_label")} {xpToNextLevel} {tr("xp_tanga")} {tr("xp_remaining")}
          </p>
        </div>
      </div>

      {/* Level milestones */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">{tr("xp_next_level")}:</span>
        <span className="text-xs font-medium text-slate-600">{getLevelTitle(level + 1)}</span>
      </div>
    </div>
  );
}
