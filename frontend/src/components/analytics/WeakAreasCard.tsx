"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingDown, CheckCircle, AlertTriangle, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useWeakAreas } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import type { TopicPerformance } from "@/types";

// Map backend tag -> translation key
const TAG_TR_KEYS: Record<string, string> = {
  ARITHMETIC:       "tag_arithmetic",
  PERCENTAGE:       "tag_percentage",
  ALGEBRA:          "tag_algebra",
  GEOMETRY:         "tag_geometry",
  WORD_PROBLEM:     "tag_word_problem",
  UNIT_CONVERSION:  "tag_unit_conv",
  STATISTICS:       "tag_statistics",
  LOGIC:            "tag_logic",
  SPELLING:         "tag_spelling",
  PUNCTUATION:      "tag_punctuation",
  GRAMMAR:          "tag_grammar",
  LEXICOLOGY:       "tag_lexicology",
  FIGURATIVE_LANGUAGE: "tag_figurative",
  LITERATURE:       "tag_literature",
  CLASSIC:          "tag_classic",
  NAVOI:            "tag_navoi",
  ERA_ANCIENT:      "tag_era_ancient",
  ERA_MEDIEVAL:     "tag_era_medieval",
  ERA_COLONIAL:     "tag_era_colonial",
  ERA_SOVIET:       "tag_era_soviet",
  ERA_INDEPENDENCE: "tag_era_indep",
  ERA_NEW_UZBEKISTAN: "tag_era_new_uz",
};

const SUBJECT_LEARN_LINKS: Record<string, string> = {
  MOTHER_TONGUE: "/learn?subject=mother_tongue",
  MATHEMATICS:   "/learn?subject=mathematics",
  HISTORY:       "/learn?subject=history",
};

const SUBJECT_COLORS: Record<string, string> = {
  MOTHER_TONGUE: "text-blue-600",
  MATHEMATICS:   "text-green-600",
  HISTORY:       "text-orange-600",
};

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const color =
    pct >= 80 ? "bg-green-500" :
    pct >= 60 ? "bg-yellow-400" :
    "bg-red-500";

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${
        pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"
      }`}>
        {pct}%
      </span>
    </div>
  );
}

function TopicRow({ topic }: { topic: TopicPerformance }) {
  const { tr } = useLang();
  const trKey = TAG_TR_KEYS[topic.tag];
  const label = trKey ? tr(trKey) : topic.tag;
  const learnLink = SUBJECT_LEARN_LINKS[topic.subject];
  const subjectColor = SUBJECT_COLORS[topic.subject] ?? "text-slate-500";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {topic.is_weak ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-800 truncate">{label}</span>
        </div>
        <span className={`text-xs ${subjectColor} ml-5`}>
          {topic.correct}/{topic.total} {tr("weak_correct")}
        </span>
      </div>
      <AccuracyBar accuracy={topic.accuracy} />
      {topic.is_weak && (
        <Link
          href={learnLink}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
        >
          {tr("weak_learn")}
        </Link>
      )}
    </div>
  );
}

export function WeakAreasCard() {
  const { tr } = useLang();
  const router = useRouter();
  const { data, isLoading } = useWeakAreas();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-slate-900">{tr("weak_loading")}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total_answers_analyzed === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-slate-900">{tr("weak_areas")}</h3>
        </div>
        <div className="text-center py-6">
          <TrendingDown className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{tr("weak_no_data")}</p>
          <Link
            href="/exam"
            className="inline-block mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            {tr("weak_start_exam")}
          </Link>
        </div>
      </div>
    );
  }

  const weakTopics = data.topics.filter(t => t.is_weak);
  const strongTopics = data.topics.filter(t => !t.is_weak);
  const displayTopics = [...weakTopics, ...strongTopics].slice(0, 8);

  const chartData = displayTopics.map((t) => ({
    name: t.tag.replace(/_/g, " ").slice(0, 15),
    accuracy: Math.round(t.accuracy * 100),
    subject: t.subject,
    isWeak: t.is_weak,
  }));

  function barColor(isWeak: boolean, accuracy: number) {
    if (isWeak || accuracy < 40) return "#ef4444";
    if (accuracy < 60) return "#f59e0b";
    return "#22c55e";
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-500" />
          {tr("weak_analysis")}
        </h3>
        <span className="text-xs text-slate-400">
          {data.total_answers_analyzed} {tr("weak_analyzed")}
        </span>
      </div>

      {weakTopics.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-700 font-medium">
            {weakTopics.length} {tr("weak_found")}
          </p>
        </div>
      )}

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          onClick={(d) => {
            const payload = (d as unknown as { activePayload?: Array<{ payload: { subject: string } }> })?.activePayload;
            if (payload?.[0]) router.push(`/drill?subject=${payload[0].payload.subject}`);
          }}
          style={{ cursor: "pointer" }}
        >
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={40} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <Tooltip formatter={(v) => [`${v}%`, "Aniqlik"]} />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.isWeak, entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Link
        href="/drill"
        className="mt-3 block text-center text-sm font-semibold text-purple-600 hover:text-purple-700"
      >
        Mashq qilish →
      </Link>
    </div>
  );
}
