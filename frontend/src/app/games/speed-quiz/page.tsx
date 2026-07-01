"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Rocket, Coins } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

const TIME_PER_Q = 8;

interface Card {
  id: number;
  question: string;
  answer: string;
  all_options: string[];
  correct_index: number;
  explanation: string | null;
}

export default function SpeedQuizPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const current = cards[idx];
  const isAnswered = selected !== null;

  async function load() {
    setLoading(true);
    setCards([]);
    setIdx(0);
    setSelected(null);
    setTimeLeft(TIME_PER_Q);
    setScore(0);
    setStreak(0);
    setDone(false);
    setCoinsEarned(0);
    try {
      const res = await gamesApi.flashcards(subject, 10);
      setCards(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const advance = useCallback((wasCorrect: boolean) => {
    const newScore = wasCorrect ? score + 1 : score;
    const newStreak = wasCorrect ? streak + 1 : 0;
    if (idx + 1 >= cards.length) {
      setDone(true);
      playSound(newScore > 0 ? "win" : "lose");
      const bonus = Math.floor(newStreak / 3);
      const earned = newScore * 2 + bonus * 5;
      setCoinsEarned(earned);
      setScore(newScore);
      setStreak(newStreak);
      if (earned > 0) userApi.awardCoins(earned, "game_speedquiz").catch(() => {});
    } else {
      setScore(newScore);
      setStreak(newStreak);
      setIdx(i => i + 1);
      setSelected(null);
      setTimeLeft(TIME_PER_Q);
    }
  }, [idx, cards, score, streak]);

  function pick(optionIdx: number) {
    if (isAnswered) return;
    setSelected(optionIdx);
    const correct = optionIdx === current.correct_index;
    playSound(correct ? "correct" : "wrong");
    setTimeout(() => advance(correct), 900);
  }

  // Timer
  useEffect(() => {
    if (!current || isAnswered || done) return;
    if (timeLeft <= 0) {
      setSelected(-1); // timed out
      setTimeout(() => advance(false), 900);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, current, isAnswered, done, advance]);

  const timerPct = (timeLeft / TIME_PER_Q) * 100;
  const timerColor = timeLeft > 4 ? "bg-orange-500" : timeLeft > 2 ? "bg-yellow-500" : "bg-red-500";

  if (!cards.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <Rocket className="w-12 h-12 text-orange-400" />
        <h1 className="text-2xl font-black text-white text-center">{tr("game_speedquiz")}</h1>
        <p className="text-slate-400 text-center max-w-sm">{tr("game_speedquiz_desc")}</p>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm"
        >
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <Rocket className="w-10 h-10 text-orange-400 animate-bounce mx-auto" />
          <p className="text-slate-400">{tr("game_loading")}</p>
        </div>
      </div>
    );
  }

  if (done) {
    const total = cards.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{pct >= 80 ? "🚀" : pct >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-black text-white">{tr("game_finish")}</h2>
        <div className="text-center">
          <p className="text-4xl font-black text-orange-400">{score}/{total}</p>
          <p className="text-slate-400 mt-1">{pct}% to'g'ri</p>
          {streak >= 3 && <p className="text-yellow-400 text-sm mt-1">🔥 {streak} ketma-ket!</p>}
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {tr("game_restart")}
          </button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Orqaga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Rocket className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white text-sm">{tr("game_speedquiz")}</span>
          <div className="ml-auto flex items-center gap-3">
            {streak >= 3 && <span className="text-xs text-yellow-400">🔥{streak}</span>}
            <span className="text-xs text-slate-400">{idx + 1}/{cards.length}</span>
          </div>
        </div>
      </nav>

      {/* Timer bar */}
      <div className="h-1.5 bg-slate-700">
        <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-5">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-slate-400">{tr("game_score")}: <span className="text-white font-bold">{score}</span></span>
          <span className={`text-2xl font-black tabular-nums ${timeLeft <= 3 ? "text-red-400" : "text-slate-300"}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full text-center">
          <p className="text-white font-semibold leading-relaxed">{current.question}</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 w-full">
          {current.all_options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correct_index;
            const timedOut = selected === -1;
            let cls = "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ";
            if (!isAnswered) {
              cls += "bg-slate-800 border-slate-600 text-white hover:border-orange-500/60 hover:bg-orange-600/10 active:scale-[0.98]";
            } else if (isCorrect) {
              cls += "bg-emerald-700/60 border-emerald-500 text-white";
            } else if (isSelected) {
              cls += "bg-red-700/60 border-red-500 text-white";
            } else {
              cls += "bg-slate-800/50 border-slate-700/50 text-slate-500";
            }
            return (
              <button key={i} onClick={() => pick(i)} disabled={!!isAnswered} className={cls}>
                <span className="text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
