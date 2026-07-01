"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Trophy, Star } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useProgressHistory } from "@/lib/queries";
import { useLang } from "@/lib/lang";

export default function ProgressPage() {
  const router = useRouter();
  const { tr } = useLang();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { data, isLoading } = useProgressHistory();

  const TREND_CONFIG = {
    improving:        { icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50",  labelKey: "trend_improving" },
    stable:           { icon: Minus,        color: "text-blue-600",   bg: "bg-blue-50",   labelKey: "trend_stable" },
    declining:        { icon: TrendingDown, color: "text-red-600",    bg: "bg-red-50",    labelKey: "trend_declining" },
    insufficient_data:{ icon: Minus,        color: "text-slate-500",  bg: "bg-slate-50",  labelKey: "trend_insufficient" },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">{tr("loading")}</div>
      </div>
    );
  }

  const trend = data?.trend ?? "insufficient_data";
  const TrendIcon = TREND_CONFIG[trend].icon;

  function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-600">{p.name}:</span>
            <span className="font-bold" style={{ color: p.color }}>{p.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">{tr("progress_title")}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {!data || data.points.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">{tr("progress_no_data")}</p>
            <p className="text-sm text-slate-400 mb-6">{tr("progress_no_data_sub")}</p>
            <Link href="/exam" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm">
              {tr("take_exam")}
            </Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label={tr("progress_exams")} value={String(data.points.length)} color="text-slate-700" />
              <StatCard label={tr("progress_average")} value={`${data.average_score}%`} color="text-blue-600" />
              <StatCard label={tr("progress_best")} value={`${data.best_score}%`} color="text-green-600" />
              <div className={`${TREND_CONFIG[trend].bg} rounded-xl border border-slate-200 p-4 text-center`}>
                <TrendIcon className={`w-6 h-6 mx-auto mb-1 ${TREND_CONFIG[trend].color}`} />
                <div className={`text-xs font-medium ${TREND_CONFIG[trend].color}`}>
                  {tr(TREND_CONFIG[trend].labelKey)}
                </div>
              </div>
            </div>

            {/* Main chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
              <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                {tr("progress_overall_pct")}
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.points} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={55} stroke="#f97316" strokeDasharray="4 4" label={{ value: "55%", position: "right", fontSize: 10, fill: "#f97316" }} />
                  <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "75%", position: "right", fontSize: 10, fill: "#22c55e" }} />
                  <Line
                    type="monotone"
                    dataKey="total_pct"
                    name={tr("progress_total")}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-2 text-center">
                — 55% ({tr("progress_acceptable")}) · — 75% ({tr("progress_good")})
              </p>
            </div>

            {/* Per-subject chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
              <h2 className="font-bold text-slate-900 mb-6">{tr("progress_by_subject")}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.points} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Line type="monotone" dataKey="mt_pct"      name={tr("subject_mother_short")} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="math_pct"    name={tr("subject_math_short")}   stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="history_pct" name={tr("subject_history_short")} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Exam history table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">{tr("progress_history")}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">#</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">{tr("progress_date")}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-blue-500">{tr("subject_mother_short")}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-green-500">{tr("subject_math_short")}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-orange-500">{tr("subject_history_short")}</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500">{tr("progress_total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.points].reverse().map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-slate-400">{data.points.length - idx}</td>
                        <td className="px-6 py-3 text-slate-600">{p.date}</td>
                        <td className={`px-4 py-3 text-right font-medium ${p.mt_pct >= 60 ? "text-green-600" : "text-red-500"}`}>{p.mt_pct}%</td>
                        <td className={`px-4 py-3 text-right font-medium ${p.math_pct >= 60 ? "text-green-600" : "text-red-500"}`}>{p.math_pct}%</td>
                        <td className={`px-4 py-3 text-right font-medium ${p.history_pct >= 60 ? "text-green-600" : "text-red-500"}`}>{p.history_pct}%</td>
                        <td className={`px-6 py-3 text-right font-bold ${p.total_pct >= 75 ? "text-green-600" : p.total_pct >= 55 ? "text-orange-500" : "text-red-500"}`}>
                          {p.total_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
