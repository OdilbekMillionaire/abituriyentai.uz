"use client";

import { useState } from "react";
import { CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { useExamReview } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import type { ExamReviewItem } from "@/types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function OptionRow({
  label,
  text,
  isCorrect,
  isSelected,
}: {
  label: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  const base = "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-colors";
  let style = "border-slate-100 bg-slate-50 text-slate-700";
  if (isCorrect) style = "border-green-300 bg-green-50 text-green-900 font-medium";
  else if (isSelected && !isCorrect) style = "border-red-300 bg-red-50 text-red-900";

  return (
    <div className={`${base} ${style}`}>
      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        isCorrect ? "bg-green-500 text-white" :
        isSelected ? "bg-red-500 text-white" :
        "bg-slate-200 text-slate-500"
      }`}>
        {label}
      </span>
      <span className="leading-relaxed">{text}</span>
      {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto mt-0.5" />}
      {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-auto mt-0.5" />}
    </div>
  );
}

function ReviewCard({ item, index }: { item: ExamReviewItem; index: number }) {
  const { tr } = useLang();
  const [open, setOpen] = useState(!item.is_correct);

  const optionTexts: Record<string, string> = {
    A: item.option_a,
    B: item.option_b,
    C: item.option_c,
    D: item.option_d,
  };

  const statusIcon = item.selected_option === null
    ? <MinusCircle className="w-5 h-5 text-slate-400" />
    : item.is_correct
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />;

  const statusText = item.selected_option === null
    ? tr("review_unanswered")
    : item.is_correct
      ? `${tr("review_correct_pts")} · +${item.points_earned.toFixed(1)}`
      : tr("review_wrong_pts");

  return (
    <div className={`bg-white rounded-xl border-2 ${
      item.is_correct ? "border-green-100" :
      item.selected_option === null ? "border-slate-100" :
      "border-red-100"
    } overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
          {index + 1}
        </span>
        {statusIcon}
        <span className="flex-1 text-sm font-medium text-slate-800 line-clamp-2">
          {item.question_text}
        </span>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <BookmarkButton questionId={item.question_id} size="sm" />
          <SubjectBadge subject={item.subject} className="text-xs" />
          <span className={`text-xs ${
            item.is_correct ? "text-green-600" :
            item.selected_option === null ? "text-slate-400" :
            "text-red-600"
          }`}>
            {statusText}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.question_text}</p>

          <div className="space-y-2">
            {OPTION_LABELS.map((label) => (
              <OptionRow
                key={label}
                label={label}
                text={optionTexts[label]}
                isCorrect={label === item.correct_option}
                isSelected={label === item.selected_option}
              />
            ))}
          </div>

          {item.explanation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">{tr("review_explanation")}</p>
              <p className="text-sm text-blue-800 leading-relaxed">{item.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AnswerReview({ sessionId }: { sessionId: number }) {
  const { tr } = useLang();
  const { data, isLoading, error } = useExamReview(sessionId);
  const [filter, setFilter] = useState<"all" | "wrong" | "correct">("all");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        {tr("review_load_error")}
      </div>
    );
  }

  const wrong = data.items.filter((i) => !i.is_correct);
  const correct = data.items.filter((i) => i.is_correct);
  const displayed =
    filter === "wrong" ? wrong :
    filter === "correct" ? correct :
    data.items;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "wrong", "correct"] as const).map((f) => {
          const count = f === "all" ? data.items.length : f === "wrong" ? wrong.length : correct.length;
          const label = f === "all" ? tr("review_filter_all") : f === "wrong" ? tr("review_filter_wrong") : tr("review_filter_correct");
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? f === "wrong" ? "bg-red-100 text-red-700" :
                    f === "correct" ? "bg-green-100 text-green-700" :
                    "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          {filter === "wrong" ? tr("review_no_wrong") : tr("review_no_answered")}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((item, idx) => (
            <ReviewCard key={item.question_id} item={item} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
