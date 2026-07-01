"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, ChevronRight, Heart } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

const MAX_LIVES = 3;
const KEYS = ["A", "B", "C", "D"];

interface KimQ {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export default function LastStandPage() {
  const { tr } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [questions, setQuestions] = useState<KimQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[idx];
  const isAnswered = selected !== null;

  async function load() {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setIdx(0);
    setSelected(null);
    setLives(MAX_LIVES);
    setScore(0);
    setDone(false);
    try {
      const res = await gamesApi.kimBolmoqchi(subject);
      if (!res.data?.length) { setError("Savollar topilmadi."); }
      else setQuestions(res.data);
    } catch {
      setError("Server xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!current || !isAnswered) return;
    const correct = selected === current.correct_index;
    const newLives = correct ? lives : lives - 1;
    const newScore = correct ? score + 1 : score;
    playSound(correct ? "correct" : "wrong");

    if (newLives <= 0) {
      const earned = newScore * 4;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_laststand").catch(() => {});
      setLives(0);
      setScore(newScore);
      playSound("lose");
      setDone(true);
      return;
    }

    if (idx + 1 >= questions.length) {
      const earned = newScore * 4;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_laststand").catch(() => {});
      setScore(newScore);
      setLives(newLives);
      playSound("win");
      setDone(true);
    } else {
      setLives(newLives);
      setScore(newScore);
      setIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (!questions.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">So&apos;nggi Qal&apos;a</h1>
        <p className="text-slate-400 text-center max-w-xs">3 ta hayoting bor — iloji boricha ko&apos;p to&apos;g&apos;ri javob ber!</p>
        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm">⚠️ {error}</div>}
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm">
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <ShieldAlert className="w-10 h-10 text-violet-400 animate-pulse mx-auto" />
          <p className="text-slate-400">Savollar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{lives > 0 ? "🏆" : "💀"}</div>
        <h2 className="text-2xl font-black text-white">{lives > 0 ? "Barakalla!" : "Hayotlar tugadi!"}</h2>
        <div className="text-center">
          <p className="text-5xl font-black text-violet-400">{score}</p>
          <p className="text-slate-400 mt-1">to&apos;g&apos;ri javob</p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} className={`w-6 h-6 ${i < lives ? "text-red-500 fill-red-500" : "text-slate-600"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-5 py-2">
          <ShieldAlert className="w-4 h-4 text-violet-400" />
          <span className="text-violet-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm">{tr("game_restart")}</button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Orqaga</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <ShieldAlert className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-white text-sm">So&apos;nggi Qal&apos;a</span>
          <span className="ml-auto text-xs text-slate-400">#{idx + 1}</span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 transition-all ${i < lives ? "text-red-500 fill-red-500" : "text-slate-600"}`} />
            ))}
          </div>
          <span className="text-violet-300 font-bold text-sm">{score} ✓</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center">
          <p className="text-white text-base font-semibold leading-relaxed">{current.question}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((val, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correct_index;
            let cls = "py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left flex items-start gap-2 ";
            if (!isAnswered) cls += "bg-slate-800 border-slate-600 text-white hover:border-violet-500/60 hover:bg-violet-600/10 active:scale-[0.97]";
            else if (isCorrect) cls += "bg-emerald-700/60 border-emerald-500 text-white";
            else if (isSelected) cls += "bg-red-700/60 border-red-500 text-white";
            else cls += "bg-slate-800/50 border-slate-700/50 text-slate-500";
            return (
              <button key={i} onClick={() => !isAnswered && setSelected(i)} disabled={!!isAnswered} className={cls}>
                <span className="font-black text-slate-400 text-xs mt-0.5 flex-shrink-0">{KEYS[i]}</span>
                <span>{val}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && current.explanation && (
          <div className={`w-full rounded-xl p-3 text-xs ${selected === current.correct_index ? "bg-emerald-900/40 border border-emerald-700 text-emerald-200" : "bg-red-900/40 border border-red-700 text-red-200"}`}>
            {current.explanation}
          </div>
        )}
        {isAnswered && (
          <button onClick={next} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            {lives - (selected !== current.correct_index ? 1 : 0) <= 0 ? "O'yin tugadi 💀" : "Davom et"}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
}
