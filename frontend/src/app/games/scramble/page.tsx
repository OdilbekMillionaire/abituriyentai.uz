"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Coins, Shuffle } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's actually different
  const result = arr.join("");
  return result === word && word.length > 1 ? scramble(word) : result;
}

export default function ScramblePage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"playing" | "correct" | "wrong" | "revealed">("playing");
  const [loading, setLoading] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  async function load() {
    setLoading(true);
    setInput("");
    setStatus("playing");
    setAttempts(0);
    setHintUsed(false);
    setCoinsEarned(0);
    try {
      const res = await gamesApi.hangman(subject, lang);
      const w = res.data.word.toUpperCase();
      setWord(w);
      setHint(res.data.hint);
      setScrambled(scramble(w));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function check() {
    const guess = input.trim().toUpperCase();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (guess === word) {
      setStatus("correct");
      playSound("win");
      const coins = hintUsed ? 5 : newAttempts === 1 ? 15 : newAttempts <= 3 ? 10 : 5;
      setCoinsEarned(coins);
      userApi.awardCoins(coins, "game_scramble").catch(() => {});
    } else {
      setStatus("wrong");
      playSound("wrong");
      setTimeout(() => {
        setStatus("playing");
        setInput("");
      }, 800);
    }
  }

  function reveal() {
    setStatus("revealed");
    setCoinsEarned(0);
  }

  if (!word && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <Shuffle className="w-12 h-12 text-cyan-400" />
        <h1 className="text-2xl font-black text-white text-center">{tr("game_scramble")}</h1>
        <p className="text-slate-400 text-center max-w-sm">{tr("game_scramble_desc")}</p>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm"
        >
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <Shuffle className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400">{tr("game_loading")}</p>
        </div>
      </div>
    );
  }

  const isFinished = status === "correct" || status === "revealed";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Shuffle className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-sm">{tr("game_scramble")}</span>
          <span className="ml-auto text-xs text-slate-400">{attempts} urinish</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-6">
        {/* Scrambled word display */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center">
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Aralashtirilgan so'z</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {scrambled.split("").map((ch, i) => (
              <span key={i} className="inline-flex items-center justify-center w-10 h-10 bg-cyan-600/30 border border-cyan-500/50 rounded-lg text-cyan-300 font-black text-lg">
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Hint */}
        {!hintUsed && !isFinished && (
          <button
            onClick={() => setHintUsed(true)}
            className="text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            💡 Maslahat ko'rish (−5 tanga)
          </button>
        )}
        {hintUsed && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 w-full text-sm text-slate-300">
            <span className="text-cyan-400 font-semibold">{tr("game_scramble_hint")}</span>{hint}
          </div>
        )}

        {/* Input or result */}
        {!isFinished ? (
          <div className="w-full space-y-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && input.trim() && check()}
              placeholder="So'zni kiriting..."
              className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 ${
                status === "wrong"
                  ? "border-red-500 ring-red-500/30 animate-pulse"
                  : "border-slate-600 focus:ring-cyan-500/50"
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={check}
                disabled={!input.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Tekshirish
              </button>
              <button
                onClick={reveal}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
              >
                Ko'rsatish
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className={`rounded-xl p-5 text-center ${status === "correct" ? "bg-emerald-900/40 border border-emerald-700" : "bg-slate-800 border border-slate-700"}`}>
              <p className="text-2xl font-black text-white tracking-widest mb-1">{word}</p>
              <p className="text-sm text-slate-400">{hint}</p>
              {status === "correct" && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">+{coinsEarned} Chaqa</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={load} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> {tr("game_restart")}
              </button>
              <Link href="/games" className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold transition-colors flex items-center">
                Orqaga
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
