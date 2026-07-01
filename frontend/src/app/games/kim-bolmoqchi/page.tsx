"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, Trophy, Lightbulb, Slash, HelpCircle } from "lucide-react";
import { gamesApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { saveScore, getPersonalBest } from "@/lib/gameScores";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "MOTHER_TONGUE", label: "📝 Ona tili" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
];

const PRIZE_LADDER = [
  { level: 1,  coins: 5   }, { level: 2,  coins: 10  }, { level: 3,  coins: 15  },
  { level: 4,  coins: 20  }, { level: 5,  coins: 30  }, { level: 6,  coins: 50  },
  { level: 7,  coins: 75  }, { level: 8,  coins: 100 }, { level: 9,  coins: 150 },
  { level: 10, coins: 200 }, { level: 11, coins: 300 }, { level: 12, coins: 400 },
  { level: 13, coins: 500 }, { level: 14, coins: 750 }, { level: 15, coins: 1000 },
];

interface Question { id: number; question: string; options: string[]; correct_index: number; explanation: string | null; difficulty: string; prize_level: number; }

type GameState = "select" | "playing" | "over" | "won";

export default function KimBolmoqchiPage() {
  const { tr } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<GameState>("select");
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [coinsWon, setCoinsWon] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Lifelines
  const [lifeline5050, setLifeline5050] = useState(true);
  const [lifelineSkip, setLifelineSkip] = useState(true);
  const [lifelineHint, setLifelineHint] = useState(true);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);

  async function startGame() {
    setLoading(true);
    try {
      const res = await gamesApi.kimBolmoqchi(subject);
      setQuestions(res.data);
      setQIdx(0); setSelected(null); setRevealed(false); setCoinsWon(0);
      setLifeline5050(true); setLifelineSkip(true); setLifelineHint(true);
      setEliminated([]); setShowHint(false);
      setGameState("playing");
    } catch { /* ignore */ }
    setLoading(false);
  }

  const q = questions[qIdx];
  const prize = PRIZE_LADDER[qIdx];

  function handleSelect(i: number) {
    if (revealed || eliminated.includes(i)) return;
    setSelected(i);
    setRevealed(true);
    playSound(i === q.correct_index ? "correct" : "wrong");
    setTimeout(() => {
      if (i === q.correct_index) {
        const earned = prize?.coins ?? 0;
        setCoinsWon((c) => c + earned);
        if (qIdx + 1 >= questions.length) { setGameState("won"); playSound("win"); }
        else { setQIdx(qIdx + 1); setSelected(null); setRevealed(false); setEliminated([]); setShowHint(false); }
      } else {
        setGameState("over");
        playSound("lose");
      }
    }, 1500);
  }

  useEffect(() => {
    if (gameState === "over" || gameState === "won") {
      const isNew = saveScore("kim-bolmoqchi", coinsWon);
      setIsNewRecord(isNew);
    }
  }, [gameState, coinsWon]);

  function use5050() {
    if (!lifeline5050 || revealed) return;
    setLifeline5050(false);
    const wrongs = [0,1,2,3].filter(i => i !== q.correct_index);
    const toElim = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(toElim);
  }

  function useSkip() {
    if (!lifelineSkip || revealed) return;
    setLifelineSkip(false);
    setEliminated([]); setShowHint(false);
    if (qIdx + 1 < questions.length) { setQIdx(qIdx + 1); setSelected(null); setRevealed(false); }
    else { setGameState("won"); }
  }

  function useHint() {
    if (!lifelineHint || revealed) return;
    setLifelineHint(false);
    setShowHint(true);
  }

  const optionColors = (i: number) => {
    if (eliminated.includes(i)) return "opacity-20 cursor-not-allowed bg-slate-700/30 border-slate-600/30 text-slate-500";
    if (!revealed) return "bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-yellow-500 cursor-pointer";
    if (i === q.correct_index) return "bg-green-600 border-green-400 text-white";
    if (i === selected) return "bg-red-600 border-red-400 text-white";
    return "bg-slate-700/50 border-slate-600/50 text-slate-400";
  };

  if (gameState === "select") return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <Link href="/games" className="absolute top-4 left-4 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🎯</div>
        <h1 className="text-3xl font-black text-white mb-2">{tr("game_kim")}</h1>
        <p className="text-slate-400">{tr("game_kim_desc")}</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {SUBJECTS.map((s) => (
          <button key={s.value} onClick={() => setSubject(s.value)}
            className={`py-3 rounded-xl font-bold text-sm transition-all ${subject === s.value ? "bg-yellow-500 text-black" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
            {s.label}
          </button>
        ))}
        <button onClick={startGame} disabled={loading}
          className="py-4 mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-xl text-lg hover:opacity-90 disabled:opacity-60 transition-all">
          {loading ? "Yuklanmoqda..." : "🎯 O'yinni boshlash"}
        </button>
      </div>
    </div>
  );

  if (gameState === "over" || gameState === "won") return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center border border-slate-700">
        <div className="text-5xl mb-4">{gameState === "won" ? "🏆" : "💔"}</div>
        <h2 className="text-2xl font-black text-white mb-1">
          {gameState === "won" ? "Tabriklaymiz!" : "O'yin tugadi"}
        </h2>
        {gameState === "over" && q && (
          <p className="text-slate-400 text-sm mb-4">
            To'g'ri javob: <strong className="text-green-400">{q.options[q.correct_index]}</strong>
          </p>
        )}
        <div className="flex items-center justify-center gap-2 my-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-yellow-300">+{coinsWon} Chaqa</span>
        </div>
        {isNewRecord && coinsWon > 0 && (
          <p className="text-sm text-emerald-400 font-semibold mb-3">🎉 Yangi rekord!</p>
        )}
        {!isNewRecord && (getPersonalBest("kim-bolmoqchi") ?? 0) > 0 && (
          <p className="text-xs text-slate-400 mb-3">
            Shaxsiy rekord: {getPersonalBest("kim-bolmoqchi")} Chaqa
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={() => setGameState("select")}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl">{tr("game_restart")}</button>
          <Link href="/games" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center">
            O'yinlar
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Prize ladder sidebar */}
      <aside className="lg:w-48 bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-700 px-3 py-2 lg:py-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
        {[...PRIZE_LADDER].reverse().map((p) => (
          <div key={p.level} className={cn(
            "flex items-center justify-between px-2 py-1 rounded-lg text-xs whitespace-nowrap flex-shrink-0 lg:flex-shrink",
            p.level === (qIdx + 1) && "bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold",
            p.level < (qIdx + 1) && "text-green-400",
            p.level > (qIdx + 1) && "text-slate-500",
          )}>
            <span>{p.level}</span>
            <span className="flex items-center gap-0.5"><Coins className="w-3 h-3" />{p.coins}</span>
          </div>
        ))}
      </aside>

      {/* Main game area */}
      <main className="flex-1 px-4 py-6 flex flex-col items-center">
        <Link href="/games" className="self-start text-slate-400 hover:text-white mb-4"><ArrowLeft className="w-5 h-5" /></Link>

        {/* Level badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
            Savol {qIdx + 1}/15
          </span>
          <span className="text-slate-400 text-sm capitalize">{q?.difficulty?.toLowerCase()}</span>
          <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
            <Coins className="w-4 h-4" /> {prize?.coins} Chaqa
          </span>
        </div>

        {/* Question */}
        <div className="max-w-2xl w-full bg-slate-800 border border-slate-600 rounded-2xl p-6 mb-6 text-center">
          <p className="text-white text-lg font-semibold leading-relaxed">{q?.question}</p>
          {showHint && q?.explanation && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-sm">
              💡 {q.explanation}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {q?.options.map((opt, i) => (
            <button key={i} onClick={() => handleSelect(i)}
              className={cn("p-4 rounded-xl border-2 font-semibold text-left transition-all", optionColors(i))}>
              <span className="text-slate-400 mr-2">{["A","B","C","D"][i]}.</span>{opt}
            </button>
          ))}
        </div>

        {/* Lifelines */}
        <div className="flex gap-4">
          <button onClick={use5050} disabled={!lifeline5050 || revealed}
            className={cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
              lifeline5050 && !revealed ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/10" : "border-slate-600 text-slate-600 cursor-not-allowed")}>
            <Slash className="w-5 h-5" /> 50:50
          </button>
          <button onClick={useSkip} disabled={!lifelineSkip || revealed}
            className={cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
              lifelineSkip && !revealed ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10" : "border-slate-600 text-slate-600 cursor-not-allowed")}>
            <ArrowLeft className="w-5 h-5 rotate-180" /> O'tkazish
          </button>
          <button onClick={useHint} disabled={!lifelineHint || revealed || showHint}
            className={cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
              lifelineHint && !revealed ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10" : "border-slate-600 text-slate-600 cursor-not-allowed")}>
            <Lightbulb className="w-5 h-5" /> Maslahat
          </button>
        </div>

        {/* Coins progress */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">{coinsWon} Chaqa</span>
          <span className="text-slate-500">to'plandi</span>
        </div>
      </main>
    </div>
  );
}
