"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Coins } from "lucide-react";
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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_WRONG = 6;

// SVG hangman stages
const HangmanSVG = ({ wrong }: { wrong: number }) => (
  <svg viewBox="0 0 120 140" className="w-36 h-40">
    {/* Gallows */}
    <line x1="10" y1="130" x2="110" y2="130" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    <line x1="30" y1="130" x2="30" y2="10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    <line x1="30" y1="10" x2="75" y2="10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    <line x1="75" y1="10" x2="75" y2="25" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    {/* Head */ wrong >= 1 && <circle cx="75" cy="35" r="10" stroke="#f87171" strokeWidth="2.5" fill="none" />}
    {/* Body */ wrong >= 2 && <line x1="75" y1="45" x2="75" y2="85" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>}
    {/* Left arm */ wrong >= 3 && <line x1="75" y1="55" x2="55" y2="70" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>}
    {/* Right arm */ wrong >= 4 && <line x1="75" y1="55" x2="95" y2="70" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>}
    {/* Left leg */ wrong >= 5 && <line x1="75" y1="85" x2="55" y2="110" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>}
    {/* Right leg */ wrong >= 6 && <line x1="75" y1="85" x2="95" y2="110" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>}
  </svg>
);

export default function HangmanPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const wrongGuesses = [...guessed].filter(l => !word.includes(l));
  const wrongCount = wrongGuesses.length;
  const revealed = word.split("").every(l => guessed.has(l));
  const lost = wrongCount >= MAX_WRONG;
  const gameOver = revealed || lost;

  async function load() {
    setLoading(true); setGuessed(new Set()); setCoinsEarned(0);
    try {
      const res = await gamesApi.hangman(subject, lang);
      setWord(res.data.word.toUpperCase().replace(/[^A-Z]/g, ""));
      setHint(res.data.hint);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [subject]);

  function guess(letter: string) {
    if (guessed.has(letter) || gameOver) return;
    const next = new Set([...guessed, letter]);
    setGuessed(next);
    const _hit = word.includes(letter);
    const _won = _hit && word.split("").every(l => next.has(l));
    const _lost = !_hit && [...next].filter(l => !word.includes(l)).length >= MAX_WRONG;
    playSound(_won ? "win" : _lost ? "lose" : _hit ? "correct" : "wrong");
    if (word.includes(letter)) {
      const newCorrect = word.split("").filter(l => next.has(l)).length;
      if (word.split("").every(l => next.has(l))) {
        setCoinsEarned((word.length * 3));
      }
    }
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const l = e.key.toUpperCase();
      if (ALPHABET.includes(l)) guess(l);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [guessed, gameOver, word]);

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800/80 border-b border-slate-700 px-4 h-14 flex items-center gap-3">
        <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-white flex-1">🔤 {tr("game_hangman")}</span>
        <span className="text-xs text-red-400">{wrongCount}/{MAX_WRONG} xato</span>
        <button onClick={load} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </nav>

      {/* Subject selector */}
      <div className="flex gap-2 justify-center pt-4 px-4">
        {SUBJECTS.map(s => (
          <button key={s.value} onClick={() => setSubject(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${subject === s.value ? "bg-rose-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center mt-20">
          <div className="text-center"><div className="text-4xl mb-3 animate-bounce">🔤</div>
            <p className="text-slate-400">{tr("game_loading")}</p></div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center gap-6">
          {/* Hangman drawing */}
          <HangmanSVG wrong={wrongCount} />

          {/* Word display */}
          <div className="flex gap-2 flex-wrap justify-center">
            {word.split("").map((letter, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={cn("text-2xl font-black w-8 text-center",
                  guessed.has(letter) ? (lost ? "text-red-400" : "text-white") : "text-transparent")}>
                  {guessed.has(letter) ? letter : letter}
                </span>
                <div className={cn("h-0.5 w-8 rounded-full", guessed.has(letter) ? "bg-white" : "bg-slate-500")} />
              </div>
            ))}
          </div>

          {/* Hint */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center max-w-sm">
            <p className="text-xs text-slate-500 mb-1">💡 Maslahat</p>
            <p className="text-sm text-slate-300">{hint}</p>
          </div>

          {/* Game over overlay */}
          {gameOver && (() => {
            const hangmanScore = revealed ? (MAX_WRONG - wrongCount) : 0;
            const isNewRecord = revealed && saveScore("hangman", hangmanScore);
            const prevBest = getPersonalBest("hangman");
            return (
              <div className={cn("w-full rounded-2xl p-5 text-center border",
                revealed ? "bg-green-600/20 border-green-500/30" : "bg-red-600/20 border-red-500/30")}>
                <div className="text-4xl mb-2">{revealed ? "🎉" : "💀"}</div>
                <h3 className="font-black text-white text-xl mb-1">
                  {revealed ? "To'g'ri topdingiz!" : "O'yin tugadi!"}
                </h3>
                {lost && <p className="text-slate-300 text-sm mb-2">So'z: <strong className="text-white">{word}</strong></p>}
                {revealed && (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
                    </div>
                    {isNewRecord && <p className="text-emerald-400 text-sm font-bold mb-2">🎉 Yangi rekord!</p>}
                    {!isNewRecord && prevBest !== null && (
                      <p className="text-slate-400 text-xs mb-2">Shaxsiy rekord: {prevBest} xatosiz</p>
                    )}
                  </>
                )}
                <button onClick={load} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                  {tr("game_restart")}
                </button>
              </div>
            );
          })()}

          {/* Alphabet keyboard */}
          {!gameOver && (
            <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
              {ALPHABET.map(letter => {
                const isGuessed = guessed.has(letter);
                const isCorrect = isGuessed && word.includes(letter);
                const isWrong = isGuessed && !word.includes(letter);
                return (
                  <button key={letter} onClick={() => guess(letter)}
                    disabled={isGuessed}
                    className={cn("w-9 h-9 rounded-lg font-bold text-sm transition-all",
                      isCorrect ? "bg-green-600 text-white cursor-default" :
                      isWrong ? "bg-red-900/50 text-red-700 cursor-default" :
                      "bg-slate-700 hover:bg-slate-500 text-white active:scale-95")}>
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {/* Wrong guesses indicator */}
          <div className="flex gap-1.5">
            {Array(MAX_WRONG).fill(0).map((_, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-full", i < wrongCount ? "bg-red-500" : "bg-slate-700")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
