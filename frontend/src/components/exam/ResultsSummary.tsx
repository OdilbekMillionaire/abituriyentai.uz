"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { AppealButton } from "@/components/appeals/AppealButton";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { formatDateTime, getGradeColor, SUBJECT_INFO } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import type { ExamResult, SubjectBreakdown } from "@/types";

interface ResultsSummaryProps {
  result: ExamResult;
}

interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
}

function CircularProgress({ percentage, color, size = 80 }: CircularProgressProps) {
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth="8" fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
      />
    </svg>
  );
}

function SubjectCard({ breakdown }: { breakdown: SubjectBreakdown }) {
  const { tr } = useLang();
  const info = SUBJECT_INFO[breakdown.subject];
  const colorMap: Record<string, string> = {
    blue:   "#3B82F6",
    green:  "#22C55E",
    orange: "#F97316",
  };
  const hexColor = colorMap[info.color] ?? "#3B82F6";

  return (
    <div className={`bg-white rounded-xl border-2 ${info.borderColor} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <SubjectBadge subject={breakdown.subject} />
        <div className="relative">
          <CircularProgress percentage={breakdown.percentage} color={hexColor} size={64} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: hexColor }}>
            {breakdown.percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{tr("results_correct_label")}</span>
          <span className="font-bold text-slate-900">
            {breakdown.correct_count} / {breakdown.total_questions}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{tr("results_score_label")}</span>
          <span className="font-bold" style={{ color: hexColor }}>
            {breakdown.score.toFixed(1)} / {breakdown.max_score.toFixed(1)}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${breakdown.percentage}%`, backgroundColor: hexColor }}
          />
        </div>
      </div>
    </div>
  );
}

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const { tr } = useLang();
  const [showAppealSection, setShowAppealSection] = useState(false);

  const gradeColorClass = getGradeColor(result.grade_label);
  const isPassing = result.percentage >= 55;

  const competencyItems = [
    { trKey: "subject_mother_short", breakdown: result.mother_tongue_breakdown },
    { trKey: "subject_math_short",   breakdown: result.math_breakdown },
    { trKey: "subject_history_short",breakdown: result.history_breakdown },
  ];

  return (
    <div className="space-y-6">
      {/* Total Score Card */}
      <div className={`bg-white rounded-2xl border-2 p-5 sm:p-8 text-center ${isPassing ? "border-green-200" : "border-red-200"}`}>
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isPassing ? "bg-green-100" : "bg-red-100"}`}>
          <Trophy className={`w-10 h-10 ${isPassing ? "text-green-600" : "text-red-500"}`} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-1">
          {result.total_score.toFixed(1)}
        </h2>
        <p className="text-slate-400 text-sm mb-3">
          {result.max_possible_score.toFixed(1)} {tr("results_of_score")}
        </p>
        <span className={`text-2xl font-bold ${gradeColorClass}`}>
          {result.grade_label}
        </span>
        <p className="text-slate-500 text-sm mt-2">
          {result.total_correct} / {result.total_questions} {tr("results_correct_of")} ({result.percentage.toFixed(1)}%)
        </p>

        {(result.xp_earned > 0 || result.coins_earned > 0) && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            {result.xp_earned > 0 && (
              <div className="flex items-center gap-1.5 text-yellow-600">
                <span className="text-base">🪙</span>
                <span className="font-bold text-sm">+{result.xp_earned} {tr("xp_tanga")}</span>
              </div>
            )}
            {result.coins_earned > 0 && (
              <div className="flex items-center gap-1.5 text-orange-500">
                <Star className="w-4 h-4" />
                <span className="font-bold text-sm">+{result.coins_earned} bonus</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-400 mt-3">
          {result.submitted_at && `${tr("results_submitted")}: ${formatDateTime(result.submitted_at)}`}
        </div>
      </div>

      {/* Subject Breakdowns */}
      <div>
        <h3 className="font-bold text-slate-900 text-lg mb-4">{tr("results_subject_analysis")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SubjectCard breakdown={result.mother_tongue_breakdown} />
          <SubjectCard breakdown={result.math_breakdown} />
          <SubjectCard breakdown={result.history_breakdown} />
        </div>
      </div>

      {/* Competency Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {tr("results_competency_analysis")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {competencyItems.map(({ trKey, breakdown }) => (
            <div key={trKey} className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {breakdown.correct_count}
              </div>
              <div className="text-xs text-slate-500">{tr(trKey)}</div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: breakdown.total_questions }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < breakdown.correct_count ? "bg-green-400" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appeals Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {tr("results_appeals")}
          </h3>
          <button
            onClick={() => setShowAppealSection(!showAppealSection)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAppealSection ? tr("results_hide") : tr("results_view")}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{tr("results_appeal_desc")}</p>
        {showAppealSection && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600 mb-3">
              {tr("results_appeal_session")}: #{result.session_id}
            </p>
            <AppealButton
              questionId={result.session_id}
              triggerLabel={tr("results_appeal_btn")}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/exam"
          className="flex-1 text-center py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          {tr("results_retake")}
        </Link>
        <Link
          href="/learn"
          className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          {tr("results_view_lessons")}
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {tr("nav_dashboard")}
        </Link>
      </div>
    </div>
  );
}
