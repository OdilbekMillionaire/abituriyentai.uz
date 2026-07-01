"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PenLine, Coins, ChevronRight } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";
import { saveScore, getPersonalBest } from "@/lib/gameScores";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

interface FBItem {
  id: number;
  sentence: string;
  answer: string;
  options: string[];
  explanation: string;
}

export default function FillBlankPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [items, setItems] = useState<FBItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = items[idx];
  const isAnswered = selected !== null;

  async function load() {
    setLoading(true);
    setItems([]);
    setIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setCoinsEarned(0);
    setError(null);
    try {
      const res = await gamesApi.fillBlank(subject, lang);
      if (!res.data.items || res.data.items.length === 0) {
        setError("Savollar topilmadi. Qaytadan urinib ko'ring.");
      } else {
        setItems(res.data.items);
      }
    } catch {
      setError("Serverga ulanishda xatolik. Internet yoki backend ishlayotganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  function pick(opt: string) {
    if (isAnswered) return;
    setSelected(opt);
  }

  function next() {
    const correct = selected === current.answer;
    playSound(correct ? "correct" : "wrong");
    const newScore = correct ? score + 1 : score;
    if (idx + 1 >= items.length) {
      setDone(true);
      setScore(newScore);
      playSound(newScore > 0 ? "win" : "lose");
      const earned = newScore * 2;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_fillblank").catch(() => {});
    } else {
      setScore(newScore);
      setIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (!items.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <PenLine className="w-12 h-12 text-emerald-400" />
        <h1 className="text-2xl font-black text-white text-center">{tr("game_fillblank")}</h1>
        <p className="text-slate-400 text-center max-w-sm">{tr("game_fillblank_desc")}</p>
        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm text-center max-w-sm">
            ⚠️ {error}
          </div>
        )}
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm"
        >
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <PenLine className="w-10 h-10 text-emerald-400 animate-pulse mx-auto" />
          <p className="text-slate-400">{tr("game_loading")}</p>
        </div>
      </div>
    );
  }

  if (done) {
    const total = items.length;
    const pct = Math.round((score / total) * 100);
    const isNewRecord = saveScore("fill-blank", score);
    const prevBest = getPersonalBest("fill-blank");
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{pct >= 80 ? "✏️🏆" : pct >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-black text-white">{tr("game_finish")}</h2>
        <div className="text-center">
          <p className="text-4xl font-black text-emerald-400">{score}/{total}</p>
          <p className="text-slate-400 mt-1">{pct}% to'g'ri</p>
        </div>
        {isNewRecord && <p className="text-emerald-400 font-bold text-sm">🎉 Yangi rekord!</p>}
        {!isNewRecord && prevBest !== null && <p className="text-slate-400 text-xs">Shaxsiy rekord: {prevBest} ta</p>}
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {tr("game_restart")}
          </button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Orqaga
          </Link>
        </div>
      </div>
    );
  }

  // Render sentence with blank highlighted
  const parts = current.sentence.split("___");
  const filledText = selected ?? "___";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <PenLine className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">{tr("game_fillblank")}</span>
          <span className="ml-auto text-xs text-slate-400">{idx + 1}/{items.length}</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-6">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-slate-400">{tr("game_score")}: <span className="text-white font-bold">{score}</span></span>
        </div>

        {/* Sentence with blank */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center leading-relaxed">
          <p className="text-white text-base font-medium">
            {parts[0]}
            <span className={`inline-block min-w-[80px] border-b-2 mx-1 px-2 font-bold ${
              isAnswered
                ? selected === current.answer
                  ? "text-emerald-400 border-emerald-500"
                  : "text-red-400 border-red-500"
                : "text-cyan-300 border-cyan-500"
            }`}>
              {filledText}
            </span>
            {parts[1] ?? ""}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === current.answer;
            let cls = "py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-center ";
            if (!isAnswered) {
              cls += "bg-slate-800 border-slate-600 text-white hover:border-emerald-500/60 hover:bg-emerald-600/10 active:scale-[0.97]";
            } else if (isCorrect) {
              cls += "bg-emerald-700/60 border-emerald-500 text-white";
            } else if (isSelected) {
              cls += "bg-red-700/60 border-red-500 text-white";
            } else {
              cls += "bg-slate-800/50 border-slate-700/50 text-slate-500";
            }
            return (
              <button key={opt} onClick={() => pick(opt)} disabled={!!isAnswered} className={cls}>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className={`w-full rounded-xl p-4 text-sm ${selected === current.answer ? "bg-emerald-900/40 border border-emerald-700" : "bg-red-900/40 border border-red-700"}`}>
            <p className="text-slate-300">{current.explanation}</p>
          </div>
        )}

        {isAnswered && (
          <button onClick={next} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            {idx + 1 >= items.length ? "Natijani ko'rish" : tr("game_next")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
}
