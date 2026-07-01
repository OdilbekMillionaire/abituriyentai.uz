"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useBookmarks, useToggleBookmark } from "@/lib/queries";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { useLang } from "@/lib/lang";
import type { BookmarkedQuestion } from "@/types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function BookmarkedCard({
  q,
  tr,
}: {
  q: BookmarkedQuestion;
  tr: (key: string, fallback?: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const remove = useToggleBookmark();

  const optionTexts: Record<string, string> = {
    A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <SubjectBadge subject={q.subject} className="flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-slate-800 line-clamp-2">{q.question_text}</span>
        <button
          onClick={(e) => { e.stopPropagation(); remove.mutate(q.question_id); }}
          className="p-1.5 text-yellow-500 hover:text-slate-400 transition-colors flex-shrink-0"
          title={tr("bm_remove")}
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
          <p className="text-sm text-slate-800 font-medium leading-relaxed">{q.question_text}</p>
          <div className="space-y-2">
            {OPTION_LABELS.map((label) => (
              <div
                key={label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  label === q.correct_option
                    ? "bg-green-50 border border-green-200 text-green-900"
                    : "bg-slate-50 text-slate-700"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  label === q.correct_option ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {label}
                </span>
                <span>{optionTexts[label]}</span>
                {label === q.correct_option && <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />}
              </div>
            ))}
          </div>
          {q.explanation && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">{tr("explanation")}</p>
              <p className="text-sm text-blue-800 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookmarksPage() {
  const router = useRouter();
  const { tr } = useLang();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { data, isLoading } = useBookmarks();
  const [filter, setFilter] = useState<string>("all");

  const SUBJECT_FILTERS: { value: string; trKey: string }[] = [
    { value: "all",           trKey: "all" },
    { value: "MOTHER_TONGUE", trKey: "subject_mother_short" },
    { value: "MATHEMATICS",   trKey: "subject_math_short" },
    { value: "HISTORY",       trKey: "subject_history_short" },
  ];

  const filtered = filter === "all"
    ? (data?.questions ?? [])
    : (data?.questions ?? []).filter((q) => q.subject === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Bookmark className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-slate-900">{tr("bm_title")}</span>
          {data && (
            <span className="ml-auto text-sm text-slate-400">{data.total}</span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Subject filter */}
        <div className="flex gap-2 flex-wrap">
          {SUBJECT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-yellow-500 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-yellow-300"
              }`}
            >
              {tr(f.trKey)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">{tr("bm_empty")}</p>
            <p className="text-sm text-slate-400 mb-6">
              {tr("bm_empty_hint")}
            </p>
            <Link href="/exam" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">
              {tr("take_exam")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <BookmarkedCard key={q.question_id} q={q} tr={tr} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
