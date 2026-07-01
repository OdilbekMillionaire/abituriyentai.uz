"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Timer } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

const TOTAL_TIME = 60;

interface TFItem { statement: string; is_true: boolean; explanation: string; }

export default function CountdownPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [items, setItems] = useState<TFItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const current = items[idx];

  const finish = useCallback((correctCount: number) => {
    setDone(true);
    playSound(correctCount > 0 ? "win" : "lose");
    const earned = correctCount * 2;
    setCoinsEarned(earned);
    if (earned > 0) userApi.awardCoins(earned, "game_countdown").catch(() => {});
  }, []);

  // Global timer
  useEffect(() => {
    if (!items.length || done) return;
    if (timeLeft <= 0) { finish(correct); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, items.length, done, finish, correct]);

  async function load() {
    setLoading(true);
    setError(null);
    setItems([]);
    setIdx(0);
    setCorrect(0);
    setTimeLeft(TOTAL_TIME);
    setDone(false);
    setFlash(null);
    try {
      const res = await gamesApi.trueFalse(subject, lang, 15);
      if (!res.data.items?.length) { setError("Savollar topilmadi."); }
      else setItems(res.data.items);
    } catch {
      setError("Server xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function answer(val: boolean) {
    if (!current || done) return;
    const isCorrect = val === current.is_true;
    playSound(isCorrect ? "correct" : "wrong");
    const newCorrect = isCorrect ? correct + 1 : correct;
    setFlash(isCorrect ? "correct" : "wrong");
    setTimeout(() => setFlash(null), 300);
    if (idx + 1 >= items.length) {
      setCorrect(newCorrect);
      finish(newCorrect);
    } else {
      setCorrect(newCorrect);
      setIdx(i => i + 1);
    }
  }

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft <= 10 ? "bg-red-500" : timeLeft <= 20 ? "bg-yellow-500" : "bg-emerald-500";

  if (!items.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl">
          <Timer className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">60 Soniya Blitz</h1>
        <p className="text-slate-400 text-center max-w-xs">{TOTAL_TIME} soniyada iloji boricha ko'p savol javob ber!</p>
        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm">⚠️ {error}</div>}
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm">
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
          {tr("game_start")}
        </button>
        <Link href="/games" className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Timer className="w-10 h-10 text-rose-400 animate-pulse mx-auto" />
          <p className="text-slate-400">Savollar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (done) {
    const total = idx + (timeLeft <= 0 ? 1 : 0);
    const pct = total > 0 ? Math.round((correct / Math.max(total, 1)) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{pct >= 80 ? "⏱🏆" : pct >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-black text-white">Vaqt tugadi!</h2>
        <div className="text-center">
          <p className="text-5xl font-black text-rose-400">{correct}</p>
          <p className="text-slate-400 mt-1">to'g'ri javob</p>
        </div>
        <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 rounded-full px-5 py-2">
          <Timer className="w-4 h-4 text-rose-400" />
          <span className="text-rose-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm">{tr("game_restart")}</button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Orqaga</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${
      flash === "correct" ? "bg-emerald-950" : flash === "wrong" ? "bg-red-950" : "bg-slate-900"
    }`}>
      {/* Timer bar */}
      <div className="h-2 bg-slate-700 flex-shrink-0">
        <div className={`h-full ${timerColor} transition-all duration-1000`} style={{ width: `${timerPct}%` }} />
      </div>

      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Timer className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-white text-sm">60 Soniya Blitz</span>
          <span className={`ml-auto text-xl font-black ${timeLeft <= 10 ? "text-red-400" : "text-rose-300"}`}>{timeLeft}s</span>
          <span className="text-emerald-400 font-bold text-sm">{correct} ✓</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-6">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{idx + 1} / {items.length}</p>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 w-full text-center">
          <p className="text-white text-lg font-semibold leading-relaxed">{current?.statement}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => answer(true)}
            className="py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            ✓ Ha
          </button>
          <button
            onClick={() => answer(false)}
            className="py-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xl transition-all shadow-lg shadow-red-500/20"
          >
            ✗ Yo'q
          </button>
        </div>

        <p className="text-xs text-slate-600">Tez bosing — vaqt ketmoqda!</p>
      </main>
    </div>
  );
}
