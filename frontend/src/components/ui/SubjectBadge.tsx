"use client";

import { cn, SUBJECT_INFO } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import type { Subject } from "@/types";

interface SubjectBadgeProps {
  subject: Subject;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const SUBJECT_ICONS: Record<Subject, string> = {
  MOTHER_TONGUE: "📝",
  MATHEMATICS:   "📐",
  HISTORY:       "🏛️",
};

const SUBJECT_TR_KEYS: Record<Subject, string> = {
  MOTHER_TONGUE: "subject_mother_short",
  MATHEMATICS:   "subject_math_short",
  HISTORY:       "subject_history_short",
};

export function SubjectBadge({
  subject,
  size = "md",
  showIcon = true,
  className,
}: SubjectBadgeProps) {
  const { tr } = useLang();
  const info = SUBJECT_INFO[subject];
  const icon = SUBJECT_ICONS[subject];
  const label = tr(SUBJECT_TR_KEYS[subject]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        size === "sm"  && "text-xs px-2 py-0.5",
        size === "md"  && "text-sm px-2.5 py-1",
        size === "lg"  && "text-base px-3 py-1.5",
        info.bgColor,
        info.textColor,
        className
      )}
    >
      {showIcon && <span className="text-sm">{icon}</span>}
      {label}
    </span>
  );
}
