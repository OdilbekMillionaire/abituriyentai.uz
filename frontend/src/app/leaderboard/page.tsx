"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, Star } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useLeaderboard, useUserProfile } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import { SkeletonRow } from "@/components/ui/Skeleton";

const RANK_STYLES: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: "bg-yellow-50 border-yellow-300",  text: "text-yellow-700", badge: "🥇" },
  2: { bg: "bg-slate-100 border-slate-300",   text: "text-slate-600",  badge: "🥈" },
  3: { bg: "bg-orange-50 border-orange-200",  text: "text-orange-700", badge: "🥉" },
};

function LevelBadge({ level }: { level: number }) {
  const color =
    level >= 10 ? "bg-purple-100 text-purple-700" :
    level >= 5  ? "bg-blue-100 text-blue-700" :
    "bg-slate-100 text-slate-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      Lv.{level}
    </span>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { tr } = useLang();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { data: entries, isLoading } = useLeaderboard(50);
  const { data: profile } = useUserProfile();

  const myRank = entries?.findIndex((e) => e.username === profile?.username);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-slate-900">{tr("lb_title")}</span>
          {myRank !== undefined && myRank >= 0 && (
            <span className="ml-auto text-sm text-slate-500">
              {tr("lb_your_rank")}: <strong className="text-slate-900">#{myRank + 1}</strong>
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Top 3 podium */}
        {!isLoading && entries && entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* 2nd place */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center mt-6">
              <div className="text-2xl mb-2">🥈</div>
              <div className="font-bold text-slate-900 text-sm truncate">{entries[1].username}</div>
              <LevelBadge level={entries[1].level} />
              <div className="text-xs font-bold text-slate-600 mt-1">{entries[1].xp.toLocaleString()} {tr("xp")}</div>
            </div>
            {/* 1st place */}
            <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-300 p-4 text-center shadow-md">
              <div className="text-3xl mb-2">🥇</div>
              <div className="font-bold text-slate-900 text-sm truncate">{entries[0].username}</div>
              <LevelBadge level={entries[0].level} />
              <div className="text-xs font-bold text-yellow-700 mt-1">{entries[0].xp.toLocaleString()} {tr("xp")}</div>
            </div>
            {/* 3rd place */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center mt-8">
              <div className="text-2xl mb-2">🥉</div>
              <div className="font-bold text-slate-900 text-sm truncate">{entries[2].username}</div>
              <LevelBadge level={entries[2].level} />
              <div className="text-xs font-bold text-slate-600 mt-1">{entries[2].xp.toLocaleString()} {tr("xp")}</div>
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-slate-100 p-2 space-y-1">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : !entries?.length ? (
            <div className="p-12 text-center text-slate-400">{tr("lb_no_data")}</div>
          ) : (
            <div>
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const style = RANK_STYLES[rank];
                const isMe = entry.username === profile?.username;

                return (
                  <div
                    key={entry.username}
                    className={`flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-50 last:border-0 transition-colors ${
                      isMe ? "bg-blue-50 border-l-4 border-l-blue-500" :
                      style ? `${style.bg}` :
                      "hover:bg-slate-50"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {style ? (
                        <span className="text-xl">{style.badge}</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-400">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isMe ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm truncate ${isMe ? "text-blue-700" : "text-slate-900"}`}>
                          {entry.username}
                          {isMe && <span className="ml-1 text-xs text-blue-500">({tr("lb_you")})</span>}
                        </span>
                        <LevelBadge level={entry.level} />
                      </div>
                      {entry.streak_days > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">{entry.streak_days} {tr("lb_streak")}</span>
                        </div>
                      )}
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      <span className={`text-sm font-bold ${style ? style.text : "text-slate-700"}`}>
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA if not in top 50 */}
        {profile && myRank === -1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700">
            {tr("lb_not_in_top")}
            <Link href="/exam" className="ml-2 font-semibold underline hover:no-underline">
              {tr("lb_take_exam")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
