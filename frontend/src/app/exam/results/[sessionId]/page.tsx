"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, BarChart2, BookOpen } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useExamResults, useExamPercentile } from "@/lib/queries";
import { ResultsSummary } from "@/components/exam/ResultsSummary";
import { AnswerReview } from "@/components/exam/AnswerReview";
import { useLang } from "@/lib/lang";

type Tab = "summary" | "review";

export default function ExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { tr } = useLang();
  const sessionId = Number(params.sessionId);
  const [tab, setTab] = useState<Tab>("summary");

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { data: result, isLoading, error } = useExamResults(sessionId);
  const { data: percentileData } = useExamPercentile(sessionId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">{tr("exam_results_loading")}</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{tr("exam_results_not_found")}</p>
          <Link href="/exam" className="text-blue-600 hover:underline">
            {tr("exam_back_to_page")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-slate-900">{tr("exam_results_title")}</span>
          </div>
          <Link
            href="/exam"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            {tr("exam_retake_btn")}
          </Link>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setTab("summary")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "summary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            {tr("exam_tab_results")}
          </button>
          <button
            onClick={() => setTab("review")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "review"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {tr("exam_tab_review")}
            {result.total_correct < result.total_questions && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {result.total_questions - result.total_correct}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Percentile badge */}
        {percentileData && tab === "summary" && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${
            percentileData.percentile >= 50
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-amber-50 border border-amber-200"
          }`}>
            <span className="text-2xl">{percentileData.percentile >= 50 ? "🏆" : "💪"}</span>
            <p className={`text-sm font-medium ${percentileData.percentile >= 50 ? "text-emerald-700" : "text-amber-700"}`}>
              {percentileData.percentile >= 50
                ? `Barcha talabalarning ${percentileData.percentile}% dan ko'ra yaxshi natija ko'rsatdingiz!`
                : "Yaxshilash uchun harakat qiling. Mashq qilsangiz, ko'proq bo'ladi!"}
            </p>
          </div>
        )}

        {tab === "summary" ? (
          <ResultsSummary result={result} />
        ) : (
          <AnswerReview sessionId={sessionId} />
        )}
      </main>
    </div>
  );
}
