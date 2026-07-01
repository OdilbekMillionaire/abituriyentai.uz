"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";
import { ExamSimulator } from "@/components/exam/ExamSimulator";
import { useLang } from "@/lib/lang";
import type { ExamSession } from "@/types";

export default function ExamSessionPage() {
  const router = useRouter();
  const { tr } = useLang();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const stored = sessionStorage.getItem("exam_session");
    if (!stored) {
      setError("exam_session_not_found");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ExamSession;
      setSession(parsed);
    } catch {
      setError("exam_session_corrupt");
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{tr(error)}</p>
          <button
            onClick={() => router.push("/exam")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            {tr("exam_back_to_page")}
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">
          {tr("exam_loading_session")}
        </div>
      </div>
    );
  }

  return (
    <ExamSimulator
      session={session}
      onComplete={(sessionId) => {
        sessionStorage.removeItem("exam_session");
        router.push(`/exam/results/${sessionId}`);
      }}
    />
  );
}
