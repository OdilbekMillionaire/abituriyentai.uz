"use client";

import { cn } from "@/lib/utils";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { useLang } from "@/lib/lang";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  onSelectOption: (option: "A" | "B" | "C" | "D") => void;
  isReviewMode?: boolean;
  correctOption?: string;
}

const OPTIONS = ["A", "B", "C", "D"] as const;

const optionGetters = {
  A: (q: Question) => q.option_a,
  B: (q: Question) => q.option_b,
  C: (q: Question) => q.option_c,
  D: (q: Question) => q.option_d,
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  isReviewMode = false,
  correctOption,
}: QuestionCardProps) {
  const { tr } = useLang();
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">
            {tr("exam_question")} {questionNumber} / {totalQuestions}
          </span>
          <SubjectBadge subject={question.subject} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          {question.is_competency_based && (
            <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
              {tr("exam_competency")}
            </span>
          )}
          {question.era_tag && (
            <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
              {question.era_tag.replace("_", " ")}
            </span>
          )}
          <BookmarkButton questionId={question.id} size="sm" />
        </div>
      </div>

      {/* Question text */}
      <p className="text-slate-900 text-lg font-medium leading-relaxed mb-6 whitespace-pre-line">
        {question.question_text}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const optionText = optionGetters[option](question);
          const isSelected = selectedOption === option;
          const isCorrect = isReviewMode && correctOption?.toUpperCase() === option;
          const isWrong = isReviewMode && isSelected && !isCorrect;

          return (
            <button
              key={option}
              onClick={() => !isReviewMode && onSelectOption(option)}
              disabled={isReviewMode}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-start gap-3",
                // Default state
                !isSelected && !isCorrect && !isWrong && "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50",
                // Selected (during exam)
                isSelected && !isReviewMode && "border-blue-500 bg-blue-50",
                // Correct answer (review)
                isCorrect && "border-green-500 bg-green-50",
                // Wrong selected answer (review)
                isWrong && "border-red-400 bg-red-50",
                // Disabled in review mode
                isReviewMode && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold",
                  !isSelected && !isCorrect && !isWrong && "border-slate-300 text-slate-500",
                  isSelected && !isReviewMode && "border-blue-500 bg-blue-500 text-white",
                  isCorrect && "border-green-500 bg-green-500 text-white",
                  isWrong && "border-red-400 bg-red-400 text-white"
                )}
              >
                {option}
              </span>
              <span
                className={cn(
                  "text-sm leading-relaxed pt-0.5",
                  isCorrect ? "text-green-800 font-medium" :
                  isWrong   ? "text-red-700" :
                  isSelected ? "text-blue-800 font-medium" :
                  "text-slate-700"
                )}
              >
                {optionText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
