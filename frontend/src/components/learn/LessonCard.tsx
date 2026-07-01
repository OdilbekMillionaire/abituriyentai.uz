"use client";

import Link from "next/link";
import { CheckCircle, Star, BookOpen } from "lucide-react";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { cn, SUBJECT_INFO } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import type { LessonListItem } from "@/types";

const SUBJECT_ICONS: Record<string, string> = {
  MOTHER_TONGUE: "📚",
  MATHEMATICS:   "📐",
  HISTORY:       "🏛️",
};

interface LessonCardProps {
  lesson: LessonListItem;
  className?: string;
}

export function LessonCard({ lesson, className }: LessonCardProps) {
  const { tr } = useLang();
  const info = SUBJECT_INFO[lesson.subject];
  const icon = SUBJECT_ICONS[lesson.subject] ?? "📖";

  return (
    <Link
      href={`/learn/${lesson.id}`}
      className={cn(
        "group relative block bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5",
        lesson.is_completed
          ? "border-green-200"
          : `border-slate-200 hover:border-${info.color}-300`,
        className
      )}
    >
      {/* Colored top stripe */}
      <div
        className={cn(
          "h-1.5 w-full",
          lesson.is_completed
            ? "bg-gradient-to-r from-green-400 to-emerald-500"
            : info.color === "blue"
              ? "bg-gradient-to-r from-blue-400 to-blue-600"
              : info.color === "green"
                ? "bg-gradient-to-r from-green-400 to-emerald-600"
                : "bg-gradient-to-r from-orange-400 to-amber-600"
        )}
      />

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Subject icon */}
          <div className={cn(
            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl",
            lesson.is_completed ? "bg-green-50" : info.bgColor
          )}>
            {lesson.is_completed ? "✅" : icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <SubjectBadge subject={lesson.subject} size="sm" />
              {lesson.era_tag && (
                <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                  {lesson.era_tag.replace("_", " ")}
                </span>
              )}
            </div>

            <h3 className={cn(
              "font-semibold leading-snug mb-2 text-sm sm:text-base transition-colors",
              lesson.is_completed
                ? "text-green-800"
                : "text-slate-900 group-hover:text-blue-700"
            )}>
              {lesson.title}
            </h3>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{lesson.xp_reward} Chaqa</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {tr("lesson_num")}{lesson.order_index}
              </span>
              {lesson.is_completed && (
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {tr("lesson_done_badge")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
