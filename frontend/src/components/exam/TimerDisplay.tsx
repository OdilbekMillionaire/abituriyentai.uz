"use client";

import { Clock } from "lucide-react";
import { cn, formatTimeRemaining, isTimerCritical, isTimerWarning } from "@/lib/utils";
import { useLang } from "@/lib/lang";

interface TimerDisplayProps {
  secondsRemaining: number;
  className?: string;
}

export function TimerDisplay({ secondsRemaining, className }: TimerDisplayProps) {
  const { tr } = useLang();
  const isCritical = isTimerCritical(secondsRemaining);
  const isWarning = isTimerWarning(secondsRemaining);
  const isExpired = secondsRemaining <= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-colors",
        isExpired
          ? "bg-red-600 text-white"
          : isCritical
          ? "bg-red-100 text-red-600 animate-pulse"
          : isWarning
          ? "bg-yellow-100 text-yellow-700"
          : "bg-slate-100 text-slate-700",
        className
      )}
    >
      <Clock
        className={cn(
          "w-5 h-5",
          isExpired ? "text-white" : isCritical ? "text-red-500" : "text-slate-500"
        )}
      />
      <span>
        {isExpired ? tr("exam_time_expired") : formatTimeRemaining(secondsRemaining)}
      </span>
      {isCritical && !isExpired && (
        <span className="text-xs font-normal ml-1 text-red-400">!</span>
      )}
    </div>
  );
}
