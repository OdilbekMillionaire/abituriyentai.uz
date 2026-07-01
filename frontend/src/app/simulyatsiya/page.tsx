"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Timer, Trophy, Users, Star, CheckCircle } from "lucide-react";
import { isAuthenticated, examsApi } from "@/lib/api";
import { ExamSimulator } from "@/components/exam/ExamSimulator";
import { useLang } from "@/lib/lang";
import type { ExamSession } from "@/types";

type Phase = "landing" | "exam" | "done";

export default function SimulyatsiyaPage() {
  const router = useRouter();
  const { tr } = useLang();
  const [phase, setPhase] = useState<Phase>("landing");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [percentileData, setPercentileData] = useState<{
    percentile: number;
    total_participants: number;
    my_score: number;
    average_score: number;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  async function handleStart() {
    setIsStarting(true);
    try {
      const res = await examsApi.start("all", "simulyatsiya" as any);
      setSession(res.data as ExamSession);
      setPhase("exam");
    } catch {
      alert(tr("sim_error"));
    } finally {
      setIsStarting(false);
    }
  }

  async function handleComplete(sid: number) {
    setSessionId(sid);
    try {
      const res = await examsApi.getPercentile(sid);
      setPercentileData(res.data);
    } catch {
      // non-critical
    }
    setPhase("done");
  }

  if (phase === "exam" && session) {
    return <ExamSimulator session={session} onComplete={handleComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950">
      <nav className="px-4 h-16 flex items-center">
        <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {phase === "landing" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {tr("sim_title")}
            </h1>
            <p className="text-blue-200 text-lg mb-8">
              {tr("sim_subtitle")}
            </p>

            {/* Rules */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 text-left space-y-3">
              {[
                { icon: Timer,       textKey: "sim_rule_time" },
                { icon: Star,        textKey: "sim_rule_questions" },
                { icon: CheckCircle, textKey: "sim_rule_scoring" },
                { icon: Users,       textKey: "sim_rule_rank" },
              ].map(({ icon: Icon, textKey }) => (
                <div key={textKey} className="flex items-center gap-3 text-white/80">
                  <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm">{tr(textKey)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-colors disabled:opacity-60 shadow-xl"
            >
              {isStarting ? tr("sim_starting") : tr("sim_start_btn")}
            </button>

            <p className="mt-4 text-blue-300/60 text-xs">
              {tr("sim_warning")}
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center">
            <div className="bg-white rounded-3xl p-8 shadow-2xl mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{tr("sim_done")}</h2>

              {percentileData && (
                <>
                  <div className="mt-6 mb-4">
                    <div className="text-5xl font-bold text-blue-600 mb-1">
                      {percentileData.percentile}%
                    </div>
                    <p className="text-slate-500 text-sm">
                      {tr("sim_better_than")} {percentileData.percentile}% {tr("exam_percentile")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xl font-bold text-slate-900">{percentileData.my_score.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">{tr("exam_your_score")}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xl font-bold text-slate-900">{percentileData.average_score.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">{tr("exam_avg_score")}</div>
                    </div>
                  </div>

                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${percentileData.percentile}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-400"
                      style={{ left: `${percentileData.percentile}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{tr("lowest")}</span>
                    <span>{percentileData.total_participants} {tr("sim_participants")}</span>
                    <span>{tr("highest")}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {sessionId && (
                <Link
                  href={`/exam/results/${sessionId}`}
                  className="px-5 py-3 rounded-xl bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  {tr("sim_detail")}
                </Link>
              )}
              <button
                onClick={() => { setPhase("landing"); setSession(null); setPercentileData(null); }}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors text-sm"
              >
                {tr("sim_retry")}
              </button>
              <Link href="/dashboard" className="px-5 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white text-sm">
                {tr("nav_dashboard")}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
