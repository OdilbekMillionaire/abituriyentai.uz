"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useLessons } from "@/lib/queries";
import { isAuthenticated } from "@/lib/api";
import { LessonCard } from "@/components/learn/LessonCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { useLang } from "@/lib/lang";
import type { Subject } from "@/types";

type SubjectFilter = Subject | "all";

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useLang();
  const [activeSubject, setActiveSubject] = useState<SubjectFilter>("all");

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      const map: Record<string, Subject> = {
        mother_tongue: "MOTHER_TONGUE",
        mathematics: "MATHEMATICS",
        history: "HISTORY",
      };
      setActiveSubject(map[subjectParam.toLowerCase()] ?? "all");
    }
  }, [router, searchParams]);

  const { data: lessons, isLoading, error } = useLessons(
    activeSubject === "all" ? undefined : activeSubject.toLowerCase()
  );

  // Group lessons by subject
  const grouped = lessons?.reduce<Record<Subject, typeof lessons>>(
    (acc, lesson) => {
      if (!acc[lesson.subject]) acc[lesson.subject] = [];
      acc[lesson.subject].push(lesson);
      return acc;
    },
    {} as Record<Subject, typeof lessons>
  );

  const subjectOrder: Subject[] = ["MOTHER_TONGUE", "MATHEMATICS", "HISTORY"];

  const SUBJECT_FILTERS: { value: SubjectFilter; trKey: string }[] = [
    { value: "all",           trKey: "drill_all" },
    { value: "MOTHER_TONGUE", trKey: "subject_mother_short" },
    { value: "MATHEMATICS",   trKey: "subject_math_short" },
    { value: "HISTORY",       trKey: "subject_history_short" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span className="font-bold text-slate-900">{tr("nav_lessons")}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{tr("learn_title")}</h1>
          <p className="text-slate-500">{tr("learn_subtitle")}</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {SUBJECT_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveSubject(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeSubject === filter.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {tr(filter.trKey)}
            </button>
          ))}
        </div>

        {/* Subject completion progress bars */}
        {lessons && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {subjectOrder.map((subj) => {
              const subjLessons = lessons.filter((l) => l.subject === subj);
              const done = subjLessons.filter((l) => l.is_completed).length;
              const total = subjLessons.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const icons: Record<string, string> = { MOTHER_TONGUE: "📝", MATHEMATICS: "📐", HISTORY: "🏛️" };
              const colors: Record<string, string> = { MOTHER_TONGUE: "bg-blue-500", MATHEMATICS: "bg-green-500", HISTORY: "bg-orange-500" };
              return (
                <button
                  key={subj}
                  onClick={() => setActiveSubject(subj as SubjectFilter)}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      {icons[subj]} {done}/{total}
                    </span>
                    {done === total && total > 0 && <span className="text-xs text-green-600">✓</span>}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[subj]} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}%</p>
                </button>
              );
            })}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">
            {tr("learn_error")}
          </div>
        )}

        {!isLoading && grouped && (
          <div className="space-y-8">
            {subjectOrder.map((subject) => {
              const subjectLessons = grouped[subject];
              if (!subjectLessons || subjectLessons.length === 0) return null;
              return (
                <div key={subject}>
                  <div className="flex items-center gap-3 mb-4">
                    <SubjectBadge subject={subject} />
                    <span className="text-sm text-slate-400">
                      {subjectLessons.filter((l) => l.is_completed).length} / {subjectLessons.length} {tr("learn_completed")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && lessons?.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">{tr("lesson_no_lessons")}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnPageInner />
    </Suspense>
  );
}
