"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, ChevronRight } from "lucide-react";
import { gamesApi, userApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
  { value: "MOTHER_TONGUE", label: "📚 Ona tili" },
];

interface FBItem { id: number; sentence: string; answer: string; options: string[]; explanation: string; }

export default function ChainPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [items, setItems] = useState<FBItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [chain, setChain] = useState(0);
  const [maxChain, setMaxChain] = useState(0);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = items[idx];
  const isAnswered = selected !== null;

  async function load() {
    setLoading(true);
    setError(null);
    setItems([]);
    setIdx(0);
    setSelected(null);
    setChain(0);
    setMaxChain(0);
    setDone(false);
    try {
      const res = await gamesApi.fillBlank(subject, lang, 12);
      if (!res.data.items?.length) { setError("Savollar topilmadi."); }
      else setItems(res.data.items);
    } catch {
      setError("Server xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!current || !isAnswered) return;
    const correct = selected === current.answer;
    playSound(correct ? "correct" : "wrong");
    if (!correct) {
      const earned = maxChain * 2;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_chain").catch(() => {});
      setDone(true);
      return;
    }
    const newChain = chain + 1;
    const newMax = Math.max(maxChain, newChain);
    setChain(newChain);
    setMaxChain(newMax);
    if (idx + 1 >= items.length) {
      const earned = newMax * 2;
      setCoinsEarned(earned);
      if (earned > 0) userApi.awardCoins(earned, "game_chain").catch(() => {});
      playSound("win");
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (!items.length && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Zanjir O'yini</h1>
        <p className="text-slate-400 text-center max-w-xs">To'g'ri javob ber — zanjirni davom ettir. Xato qilsang — o'yin tugaydi!</p>
        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-3 text-red-300 text-sm">⚠️ {error}</div>}
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 w-64 text-sm">
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-3 rounded-2xl text-base transition-colors">
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
          <Link2 className="w-10 h-10 text-cyan-400 animate-pulse mx-auto" />
          <p className="text-slate-400">Savollar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (done) {
    const broke = selected && selected !== current?.answer;
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 p-4">
        <div className="text-6xl">{broke ? "💥" : "🏆"}</div>
        <h2 className="text-2xl font-black text-white">{broke ? "Zanjir uzildi!" : "Barakalla!"}</h2>
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-1">Maksimal zanjir</p>
          <p className="text-5xl font-black text-cyan-400">{maxChain}</p>
        </div>
        {broke && current && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 max-w-sm text-center">
            <p className="text-xs text-slate-400 mb-1">To'g'ri javob:</p>
            <p className="text-emerald-400 font-bold">{current.answer}</p>
          </div>
        )}
        <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-5 py-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 font-bold">+{coinsEarned} Chaqa</span>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={load} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm">{tr("game_restart")}</button>
          <Link href="/games" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Orqaga</Link>
        </div>
      </div>
    );
  }

  const parts = current.sentence.split("___");
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-sm">Zanjir</span>
          <span className="ml-auto flex items-center gap-1 text-cyan-300 font-black text-sm">
            🔗 {chain}
          </span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full gap-5">
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(chain, 10) }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-cyan-500" />
          ))}
          {chain === 0 && <p className="text-xs text-slate-500">Zanjirni boshlang!</p>}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full text-center leading-relaxed">
          <p className="text-white text-base font-medium">
            {parts[0]}
            <span className={`inline-block min-w-[80px] border-b-2 mx-1 px-2 font-bold ${
              isAnswered
                ? selected === current.answer ? "text-emerald-400 border-emerald-500" : "text-red-400 border-red-500"
                : "text-cyan-300 border-cyan-500"
            }`}>
              {selected ?? "___"}
            </span>
            {parts[1] ?? ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {current.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === current.answer;
            let cls = "py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-center ";
            if (!isAnswered) cls += "bg-slate-800 border-slate-600 text-white hover:border-cyan-500/60 hover:bg-cyan-600/10 active:scale-[0.97]";
            else if (isCorrect) cls += "bg-emerald-700/60 border-emerald-500 text-white";
            else if (isSelected) cls += "bg-red-700/60 border-red-500 text-white";
            else cls += "bg-slate-800/50 border-slate-700/50 text-slate-500";
            return (
              <button key={opt} onClick={() => !isAnswered && setSelected(opt)} disabled={!!isAnswered} className={cls}>{opt}</button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`w-full rounded-xl p-3 text-xs ${selected === current.answer ? "bg-emerald-900/40 border border-emerald-700 text-emerald-200" : "bg-red-900/40 border border-red-700 text-red-200"}`}>
            {current.explanation}
          </div>
        )}
        {isAnswered && (
          <button onClick={next} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            {selected !== current.answer ? "O'yin tugadi 💥" : "Davom et"} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
}
