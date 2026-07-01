"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Coins, CheckCircle2, XCircle } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";
import { saveScore, getPersonalBest } from "@/lib/gameScores";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

const TIME_PER_Q = 10;

interface TFItem {
  id: number;
  statement: string;
  is_true: boolean;
  explanation: string;
}

type Answer = "true" | "false" | null;

export default function TrueFalsePage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [items, setItems] = useState<TFItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [done, setDone] = useState(false);

  const current = items[idx];
  const isAnswered = answers[idx] !== undefined;
  const score = answers.filter((a, i) => a !== null && items[i] && (a === "true") === items[i].is_true).length;

  async function load() {
    setLoading(true);
    setItems([]);
    setIdx(0);
    setAnswers([]);
    setDone(false);
    setCoinsEarned(0);
    try {
      const res = await gamesApi.trueFalse(subject, lang);
      setItems(res.data.items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const advance = useCallback(() => {
    setShowExplanation(false);
    if (idx + 1 >= items.length) {
      setDone(true);
      const correct = answers.filter((a, i) => a !== null && items[i] && (a === "true") === items[i].is_true).length;
      playSound(correct > 0 ? "win" : "lose");
      const earned = correct * 2;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_truefalse").catch(() => {});
    } else {
      setIdx(i => i + 1);
      setTimeLeft(TIME_PER_Q);
    }
  }, [idx, items, answers]);

  function answer(val: "true" | "false") {
    if (isAnswered) return;
    const updated = [...answers];
    updated[idx] = val;
    setAnswers(updated);
    playSound(current && (val === "true") === current.is_true ? "correct" : "wrong");
    setShowExplanation(true);
    setTimeLeft(0);
  }

  // Timer
  useEffect(() => {
    if (!current || isAnswered || done) return;
    if (timeLeft <= 0) {
      // Time up — mark as null (skipped)
      const updated = [...answers];
      updated[idx] = null;
      setAnswers(updated);
      setShowExplanation(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, current, isAnswered, done, answers, idx]);

  // Auto-advance after explanation
  useEffect(() => {
    if (!showExplanation) return;
    const t = setTimeout(advance, 2200);
    return () => clearTimeout(t);
  }, [showExplanation, advance]);

  const timerPct = (timeLeft / TIME_PER_Q) * 100;
  const timerColor = timeLeft > 5 ? "bg-emerald-500" : timeLeft > 2 ? "bg-yellow-500" : "bg-red-500";

  if (!items.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <Zap className="w-12 h-12 text-yellow-400" />
        <h1 className="text-2xl font-black text-white text-center">{tr("game_truefalse")}</h1>
        <p className="text-slate-400 text-center max-w-sm">{tr("game_truefalse_desc")}</p>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm"
        >
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <Zap className="w-10 h-10 text-yellow-400 animate-bounce mx-auto" />
          <p className="text-slate-400">{tr("game_loading")}</p>
        </div>
      </div>
    );
  }

  if (done) {
    const total = items.length;
    const pct = Math.round((score / total) * 100);
    const isNewRecord = saveScore("true-false", score);
    const prevBest = getPersonalBest("true-false");
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-black text-white">{tr("game_finish")}</h2>
        <div className="text-center">
          <p className="text-4xl font-black text-yellow-400">{score}/{total}</p>
          <p className="text-slate-400 mt-1">{pct}% to'g'ri</p>
        </div>
        {isNewRecord && <p className="text-emerald-400 font-bold text-sm">🎉 Yangi rekord!</p>}
        {!isNewRecord && prevBest !== null && <p className="text-slate-400 text-xs">Shaxsiy rekord: {prevBest} ta</p>}
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {tr("game_restart")}
          </button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Orqaga
          </Link>
        </div>
      </div>
    );
  }

  const userAnswer = answers[idx];
  const isCorrect = userAnswer !== null && userAnswer !== undefined
    ? (userAnswer === "true") === current.is_true
    : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-white text-sm">{tr("game_truefalse")}</span>
          <span className="ml-auto text-xs text-slate-400">{idx + 1}/{items.length}</span>
        </div>
      </nav>

      {/* Timer bar */}
      <div className="h-1.5 bg-slate-700">
        <div
          className={`h-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-6">
        {/* Score + timer */}
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-slate-400">{tr("game_score")}: <span className="text-white font-bold">{score}</span></span>
          <span className={`text-2xl font-black tabular-nums ${timeLeft <= 3 ? "text-red-400" : "text-slate-300"}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Statement card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center">
          <p className="text-white text-lg font-semibold leading-relaxed">{current.statement}</p>
        </div>

        {/* T/F buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {(["true", "false"] as const).map(val => {
            const label = val === "true" ? tr("game_tf_true") : tr("game_tf_false");
            const isSelected = userAnswer === val;
            const isRightAnswer = (val === "true") === current.is_true;
            let btnClass = "py-5 rounded-2xl font-black text-lg transition-all border-2 ";
            if (!isAnswered) {
              btnClass += val === "true"
                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40 hover:border-emerald-400 active:scale-95"
                : "bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40 hover:border-red-400 active:scale-95";
            } else if (isRightAnswer) {
              btnClass += "bg-emerald-600 border-emerald-500 text-white scale-105";
            } else if (isSelected) {
              btnClass += "bg-red-600 border-red-500 text-white";
            } else {
              btnClass += "bg-slate-700/50 border-slate-600/50 text-slate-500";
            }
            return (
              <button key={val} onClick={() => answer(val)} disabled={isAnswered} className={btnClass}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`w-full rounded-xl p-4 flex items-start gap-3 ${isCorrect ? "bg-emerald-900/40 border border-emerald-700" : "bg-red-900/40 border border-red-700"}`}>
            {isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            <p className="text-sm text-slate-200">{current.explanation}</p>
          </div>
        )}
      </main>
    </div>
  );
}
