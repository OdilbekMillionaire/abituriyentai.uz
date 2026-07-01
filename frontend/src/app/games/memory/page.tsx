"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Coins, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const CARD_SETS = {
  SCIENCE: ["⚛️","🧪","🔬","🧬","🌡️","⚡","🔭","💡"],
  MATH:    ["➕","➖","✖️","➗","π","∞","√","∑"],
  HISTORY: ["🏛️","⚔️","👑","🗺️","📜","🏺","⚓","🎭"],
  NATURE:  ["🌍","🌊","🌋","🌿","🦁","🦋","🌸","❄️"],
} as const;

type Category = keyof typeof CARD_SETS;

interface Card {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(emojis: readonly string[]): Card[] {
  const doubled = [...emojis, ...emojis];
  // shuffle
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((emoji, i) => ({
    id: i,
    emoji,
    pairId: emojis.indexOf(emoji),
    flipped: false,
    matched: false,
  }));
}

export default function MemoryPage() {
  const { tr } = useLang();
  const [category, setCategory] = useState<Category>("SCIENCE");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const TOTAL_PAIRS = 8;

  function start(cat?: Category) {
    const c = cat ?? category;
    setCards(buildDeck(CARD_SETS[c]));
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setDone(false);
    setLocked(false);
    setCoinsEarned(0);
    setStartTime(Date.now());
    setElapsed(0);
  }

  // Timer
  useEffect(() => {
    if (!startTime || done) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [startTime, done]);

  const flip = useCallback((id: number) => {
    if (locked) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;
    if (flipped.length === 1 && flipped[0] === id) return;

    const newFlipped = [...flipped, id];
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    setFlipped(newFlipped);
    playSound("flip");

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      if (newCards[a].pairId === newCards[b].pairId) {
        playSound("correct");
        // Match!
        const afterMatch = newCards.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c);
        setTimeout(() => {
          setCards(afterMatch);
          setFlipped([]);
          setLocked(false);
          const newMatched = matched + 1;
          setMatched(newMatched);
          if (newMatched >= TOTAL_PAIRS) {
            playSound("win");
            const secs = Math.floor((Date.now() - startTime) / 1000);
            setElapsed(secs);
            setDone(true);
            const bonus = moves < 15 ? 20 : moves < 20 ? 10 : 5;
            setCoinsEarned(10 + bonus);
          }
        }, 400);
      } else {
        playSound("wrong");
        // No match — flip back
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [cards, flipped, locked, matched, moves, startTime]);

  if (!cards.length) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <Brain className="w-12 h-12 text-violet-400" />
        <h1 className="text-2xl font-black text-white text-center">{tr("game_memory")}</h1>
        <p className="text-slate-400 text-center max-w-sm">{tr("game_memory_desc")}</p>
        <div className="grid grid-cols-2 gap-2 w-64">
          {(Object.keys(CARD_SETS) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                category === cat
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-300 hover:border-violet-500/50"
              }`}
            >
              {cat === "SCIENCE" ? "🔬 Fan" : cat === "MATH" ? "📐 Math" : cat === "HISTORY" ? "🏛️ Tarix" : "🌍 Tabiat"}
            </button>
          ))}
        </div>
        <button onClick={() => start()} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
          {tr("game_start")}
        </button>
        <Link href="/games" className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </Link>
      </div>
    );
  }

  if (done) {
    const perfect = moves <= TOTAL_PAIRS;
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{perfect ? "🧠✨" : moves < 20 ? "🧠👍" : "🧠"}</div>
        <h2 className="text-2xl font-black text-white">{tr("game_finish")}</h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-violet-400">{moves}</p>
            <p className="text-xs text-slate-400 mt-1">{tr("game_moves")}</p>
          </div>
          <div>
            <p className="text-3xl font-black text-cyan-400">{elapsed}s</p>
            <p className="text-xs text-slate-400 mt-1">Vaqt</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={() => start()} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> {tr("game_restart")}
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
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-white text-sm">{tr("game_memory")}</span>
          <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
            <span>{tr("game_pairs_left")}: <span className="text-white font-bold">{TOTAL_PAIRS - matched}</span></span>
            <span>{tr("game_moves")}: <span className="text-white font-bold">{moves}</span></span>
            <span className="text-slate-500">{elapsed}s</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="grid grid-cols-4 gap-2.5 w-full max-w-sm">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className={`aspect-square rounded-xl border-2 text-3xl flex items-center justify-center transition-all duration-200 ${
                card.matched
                  ? "bg-violet-900/40 border-violet-600/50 opacity-50 cursor-default"
                  : card.flipped
                    ? "bg-violet-700/40 border-violet-500 scale-105"
                    : "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700 active:scale-95 cursor-pointer"
              }`}
            >
              {(card.flipped || card.matched) ? card.emoji : "?"}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
