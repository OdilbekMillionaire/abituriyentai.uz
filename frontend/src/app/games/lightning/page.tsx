"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, ChevronRight } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

const TIME_PER_Q = 8;
const KEYS = ["A", "B", "C", "D"];

interface KimQ {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export default function LightningPage() {
  const { tr } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [questions, setQuestions] = useState<KimQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[idx];
  const isAnswered = selected !== null;

  const advance = useCallback(() => {
    const correct = selected === current?.correct_index;
    const newScore = correct ? score + 1 : score;
    if (idx + 1 >= questions.length) {
      setDone(true);
      setScore(newScore);
      playSound(newScore > 0 ? "win" : "lose");
      const earned = newScore * 3;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_lightning").catch(() => {});
    } else {
      setScore(newScore);
      setIdx(i => i + 1);
      setSelected(null);
      setTimeLeft(TIME_PER_Q);
    }
  }, [selected, current, score, idx, questions.length]);

  useEffect(() => {
    if (!current || isAnswered || done) return;
    if (timeLeft <= 0) { setSelected(-1); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, current, isAnswered, done]);

  useEffect(() => {
    if (!isAnswered || done) return;
    const t = setTimeout(advance, 1400);
    return () => clearTimeout(t);
  }, [isAnswered, done, advance]);

  useEffect(() => {
    if (isAnswered && !done && current) {
      playSound(selected === current.correct_index ? "correct" : "wrong");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered]);

  async function load() {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setTimeLeft(TIME_PER_Q);
    try {
      const res = await gamesApi.kimBolmoqchi(subject);
      if (!res.data?.length) { setError("Savollar topilmadi."); }
      else setQuestions(res.data.slice(0, 10));
    } catch {
      setError("Server xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  if (!questions.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Chaqmoq Raund</h1>
        <p className="text-slate-400 text-center max-w-xs">10 savol · har biri {TIME_PER_Q} soniya · tez javob ber!</p>
        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm">⚠️ {error}</div>}
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm">
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <Zap className="w-10 h-10 text-yellow-400 animate-pulse mx-auto" />
          <p className="text-slate-400">Savollar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{pct >= 80 ? "⚡🏆" : pct >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-black text-white">{tr("game_finish")}</h2>
        <p className="text-5xl font-black text-yellow-400">{score}/{questions.length}</p>
        <p className="text-slate-400">{pct}% to&apos;g&apos;ri</p>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm">{tr("game_restart")}</button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Orqaga</Link>
        </div>
      </div>
    );
  }

  const timerPct = (timeLeft / TIME_PER_Q) * 100;
  const timerColor = timeLeft <= 3 ? "bg-red-500" : timeLeft <= 5 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-white text-sm">Chaqmoq Raund</span>
          <span className="ml-auto text-xs text-slate-400">{idx + 1}/{questions.length}</span>
          <span className={`text-sm font-black ${timeLeft <= 3 ? "text-red-400" : "text-yellow-300"}`}>{timeLeft}s</span>
        </div>
        <div className="h-1 bg-slate-700">
          <div className={`h-full ${timerColor} transition-all duration-1000`} style={{ width: `${timerPct}%` }} />
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ball: {score}</p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center">
          <p className="text-white text-base font-semibold leading-relaxed">{current.question}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((val, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correct_index;
            let cls = "py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left flex items-start gap-2 ";
            if (!isAnswered) {
              cls += "bg-slate-800 border-slate-600 text-white hover:border-yellow-500/60 hover:bg-yellow-500/10 active:scale-[0.97]";
            } else if (isCorrect) {
              cls += "bg-emerald-700/60 border-emerald-500 text-white";
            } else if (isSelected) {
              cls += "bg-red-700/60 border-red-500 text-white";
            } else {
              cls += "bg-slate-800/50 border-slate-700/50 text-slate-500";
            }
            return (
              <button key={i} onClick={() => !isAnswered && setSelected(i)} disabled={!!isAnswered} className={cls}>
                <span className="font-black text-slate-400 text-xs mt-0.5 flex-shrink-0">{KEYS[i]}</span>
                <span>{val}</span>
              </button>
            );
          })}
        </div>
        {isAnswered && selected !== -1 && current.explanation && (
          <div className={`w-full rounded-xl p-3 text-xs ${selected === current.correct_index ? "bg-emerald-900/40 border border-emerald-700 text-emerald-200" : "bg-red-900/40 border border-red-700 text-red-200"}`}>
            {current.explanation}
          </div>
        )}
        {isAnswered && (
          <button onClick={advance} className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            {idx + 1 >= questions.length ? "Natija" : "Keyingisi"} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
}
