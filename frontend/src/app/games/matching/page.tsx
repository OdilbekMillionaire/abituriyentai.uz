"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Coins, CheckCircle2 } from "lucide-react";
import { gamesApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "MOTHER_TONGUE", label: "📝 Ona tili" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
];

interface Pair { id: number; left: string; right: string; }

export default function MatchingPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("HISTORY");
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<"left" | "right" | null>(null);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Shuffled right-side items with their original pair id
  const [leftItems, setLeftItems] = useState<Pair[]>([]);
  const [rightItems, setRightItems] = useState<Pair[]>([]);

  async function load() {
    setLoading(true); setDone(false); setMoves(0);
    setSelectedLeft(null); setSelectedRight(null);
    setMatched(new Set()); setCoinsEarned(0);
    try {
      const res = await gamesApi.matching(subject, "", lang);
      const data: Pair[] = res.data.pairs;
      setPairs(data);
      setLeftItems([...data].sort(() => Math.random() - 0.5));
      setRightItems([...data].sort(() => Math.random() - 0.5));
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [subject]);

  function handleLeft(id: number) {
    if (matched.has(id)) return;
    setSelectedLeft(id);
    if (selectedRight !== null) checkMatch(id, selectedRight);
  }

  function handleRight(id: number) {
    if (matched.has(id)) return;
    setSelectedRight(id);
    if (selectedLeft !== null) checkMatch(selectedLeft, id);
  }

  function checkMatch(leftId: number, rightId: number) {
    setMoves((m) => m + 1);
    if (leftId === rightId) {
      const next = new Set([...matched, leftId]);
      setMatched(next);
      setSelectedLeft(null); setSelectedRight(null);
      setCoinsEarned((c) => c + 5);
      playSound(next.size === pairs.length ? "win" : "correct");
      if (next.size === pairs.length) setDone(true);
    } else {
      setWrongFlash("left");
      playSound("wrong");
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null); setSelectedRight(null);
      }, 600);
    }
  }

  const leftColor = (id: number) => {
    if (matched.has(id)) return "bg-green-600/30 border-green-500 text-green-200";
    if (selectedLeft === id) return "bg-blue-600/40 border-blue-400 text-white";
    if (wrongFlash === "left" && selectedLeft === id) return "bg-red-600/40 border-red-400 text-red-200";
    return "bg-slate-700 border-slate-600 text-white hover:border-blue-400 cursor-pointer";
  };

  const rightColor = (id: number) => {
    if (matched.has(id)) return "bg-green-600/30 border-green-500 text-green-200";
    if (selectedRight === id) return "bg-purple-600/40 border-purple-400 text-white";
    return "bg-slate-700 border-slate-600 text-white hover:border-purple-400 cursor-pointer";
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">🔗</div>
        <p className="text-slate-400">{tr("game_loading")}</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800/80 border-b border-slate-700 px-4 h-14 flex items-center gap-3">
        <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-white flex-1">🔗 {tr("game_matching")}</span>
        <span className="text-xs text-slate-400">{matched.size}/{pairs.length} juft</span>
        <button onClick={load} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* Subject selector */}
        <div className="flex gap-2 justify-center mb-4">
          {SUBJECTS.map((s) => (
            <button key={s.value} onClick={() => setSubject(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${subject === s.value ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {done ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-white mb-2">Barcha juftlar topildi!</h2>
            <p className="text-slate-400 mb-4">{moves} ta urinishda</p>
            <div className="flex items-center justify-center gap-2 mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 max-w-xs mx-auto">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-300">+{coinsEarned} Chaqa</span>
            </div>
            <button onClick={load} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">{tr("game_restart")}</button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(matched.size / pairs.length) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{moves} urinish</span>
                <span className="text-yellow-400">🪙 +{coinsEarned}</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2 text-center">Atama / Savol</p>
                {leftItems.map((item) => (
                  <button key={item.id} onClick={() => handleLeft(item.id)} disabled={matched.has(item.id)}
                    className={cn("w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all", leftColor(item.id))}>
                    {matched.has(item.id) && <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />}
                    {item.left}
                  </button>
                ))}
              </div>

              {/* Right column */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2 text-center">Ta'rif / Javob</p>
                {rightItems.map((item) => (
                  <button key={item.id} onClick={() => handleRight(item.id)} disabled={matched.has(item.id)}
                    className={cn("w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all", rightColor(item.id))}>
                    {matched.has(item.id) && <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />}
                    {item.right}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
