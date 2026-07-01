"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Eye, CheckCircle2, Zap, Grid3x3 } from "lucide-react";
import { gamesApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "Matematika", icon: "📐", color: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/40" },
  { value: "MOTHER_TONGUE", label: "Ona tili",   icon: "📝", color: "from-blue-500 to-indigo-600",  glow: "shadow-blue-500/40"    },
  { value: "HISTORY",       label: "Tarix",      icon: "🏛️", color: "from-amber-500 to-orange-600", glow: "shadow-amber-500/40"   },
];

interface Clue {
  number: number; clue: string; answer: string;
  row: number; col: number; direction: "across" | "down"; length: number;
}

export default function CrosswordPage() {
  const { tr, lang } = useLang();
  const [subject, setSubject]     = useState("HISTORY");
  const [grid, setGrid]           = useState<string[][]>([]);
  const [clues, setClues]         = useState<Clue[]>([]);
  const [userGrid, setUserGrid]   = useState<string[][]>([]);
  const [selected, setSelected]   = useState<{ row: number; col: number } | null>(null);
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [loading, setLoading]     = useState(false);
  const [solved, setSolved]       = useState<Set<number>>(new Set());
  const [revealed, setRevealed]   = useState<Set<string>>(new Set());
  const [justSolved, setJustSolved] = useState<Set<number>>(new Set());
  const [coinsEarned, setCoinsEarned] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  async function load() {
    setLoading(true);
    setSolved(new Set()); setRevealed(new Set()); setJustSolved(new Set());
    setSelected(null); setActiveClue(null); setCoinsEarned(0);
    try {
      const res = await gamesApi.crossword({ subject, topic: "", language: lang });
      const g: string[][] = res.data.grid;
      setGrid(g);
      setClues(res.data.clues);
      setUserGrid(g.map(row => row.map(cell => cell === "#" ? "#" : "")));
    } catch { /* ignore */ }
    setLoading(false);
  }

  function getClueForCell(row: number, col: number): Clue | undefined {
    return clues.find(c => {
      for (let i = 0; i < c.length; i++) {
        const r = c.row + (c.direction === "down" ? i : 0);
        const co = c.col + (c.direction === "across" ? i : 0);
        if (r === row && co === col) return true;
      }
      return false;
    });
  }

  function handleCellClick(row: number, col: number) {
    if (grid[row]?.[col] === "#" || grid[row]?.[col] === "") return;
    // If clicking same cell that's already selected and it belongs to multiple clues, toggle direction
    if (selected?.row === row && selected?.col === col && activeClue) {
      const cluesForCell = clues.filter(c => {
        for (let i = 0; i < c.length; i++) {
          const r = c.row + (c.direction === "down" ? i : 0);
          const co = c.col + (c.direction === "across" ? i : 0);
          if (r === row && co === col) return true;
        }
        return false;
      });
      if (cluesForCell.length > 1) {
        const other = cluesForCell.find(c => c.number !== activeClue.number || c.direction !== activeClue.direction);
        if (other) { setActiveClue(other); return; }
      }
    }
    setSelected({ row, col });
    const clue = getClueForCell(row, col);
    if (clue) setActiveClue(clue);
  }

  function handleInput(row: number, col: number, value: string) {
    const ch = value.slice(-1).toUpperCase();
    const next = userGrid.map(r => [...r]);
    next[row][col] = ch;
    setUserGrid(next);
    const newSolved = new Set(solved);
    const newJust = new Set<number>();
    clues.forEach(c => {
      let correct = true;
      for (let i = 0; i < c.length; i++) {
        const r = c.row + (c.direction === "down" ? i : 0);
        const co = c.col + (c.direction === "across" ? i : 0);
        if (next[r]?.[co] !== c.answer[i]) { correct = false; break; }
      }
      if (correct && !newSolved.has(c.number)) {
        newSolved.add(c.number);
        newJust.add(c.number);
        setCoinsEarned(prev => prev + 5);
      }
    });
    setSolved(newSolved);
    if (newJust.size > 0) {
      playSound(newSolved.size >= clues.length ? "win" : "correct");
      setJustSolved(newJust);
      setTimeout(() => setJustSolved(new Set()), 1200);
    }
    if (activeClue && ch) {
      const pos = [...Array(activeClue.length)].findIndex((_, i) => {
        const r = activeClue.row + (activeClue.direction === "down" ? i : 0);
        const co = activeClue.col + (activeClue.direction === "across" ? i : 0);
        return r === row && co === col;
      });
      if (pos < activeClue.length - 1) {
        const nr = activeClue.row + (activeClue.direction === "down" ? pos + 1 : 0);
        const nc = activeClue.col + (activeClue.direction === "across" ? pos + 1 : 0);
        inputRefs.current[`${nr}-${nc}`]?.focus();
        setSelected({ row: nr, col: nc });
      }
    }
  }

  function handleKeyDown(row: number, col: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !userGrid[row]?.[col] && activeClue) {
      const pos = [...Array(activeClue.length)].findIndex((_, i) => {
        const r = activeClue.row + (activeClue.direction === "down" ? i : 0);
        const co = activeClue.col + (activeClue.direction === "across" ? i : 0);
        return r === row && co === col;
      });
      if (pos > 0) {
        const pr = activeClue.row + (activeClue.direction === "down" ? pos - 1 : 0);
        const pc = activeClue.col + (activeClue.direction === "across" ? pos - 1 : 0);
        inputRefs.current[`${pr}-${pc}`]?.focus();
        setSelected({ row: pr, col: pc });
      }
    }
  }

  function revealCell() {
    if (!selected) return;
    const key = `${selected.row}-${selected.col}`;
    setRevealed(prev => new Set([...prev, key]));
    const next = userGrid.map(r => [...r]);
    next[selected.row][selected.col] = grid[selected.row][selected.col];
    setUserGrid(next);
  }

  // Compute active cells
  const activeCells = new Set<string>();
  if (activeClue) {
    for (let i = 0; i < activeClue.length; i++) {
      const r = activeClue.row + (activeClue.direction === "down" ? i : 0);
      const c = activeClue.col + (activeClue.direction === "across" ? i : 0);
      activeCells.add(`${r}-${c}`);
    }
  }

  const nonBlackCells = grid.flatMap((row, r) => row.map((cell, c) => ({ r, c, cell }))).filter(x => x.cell !== "#" && x.cell !== "");
  const minR = nonBlackCells.length ? Math.min(...nonBlackCells.map(x => x.r)) : 0;
  const maxR = nonBlackCells.length ? Math.max(...nonBlackCells.map(x => x.r)) : 14;
  const minC = nonBlackCells.length ? Math.min(...nonBlackCells.map(x => x.c)) : 0;
  const maxC = nonBlackCells.length ? Math.max(...nonBlackCells.map(x => x.c)) : 14;

  const clueNumbers = new Map<string, number>();
  clues.forEach(c => clueNumbers.set(`${c.row}-${c.col}`, c.number));

  const allSolved = clues.length > 0 && solved.size === clues.length;
  const progress = clues.length > 0 ? Math.round((solved.size / clues.length) * 100) : 0;

  // ── Select screen ──────────────────────────────────────────────────────────
  if (!grid.length) return (
    <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <Link href="/games" className="absolute top-5 left-5 text-slate-500 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="relative z-10 text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Grid3x3 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{tr("game_crossword")}</h1>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">{tr("game_crossword_desc")}</p>
      </div>

      <div className="relative z-10 flex flex-col gap-3 w-full max-w-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-1">{tr("game_select_subject")}</p>
        {SUBJECTS.map(s => (
          <button key={s.value} onClick={() => setSubject(s.value)}
            className={cn(
              "relative py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 border",
              subject === s.value
                ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-lg ${s.glow}`
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            )}>
            <span className="text-xl">{s.icon}</span>
            {s.label}
            {subject === s.value && (
              <span className="ml-auto w-2 h-2 rounded-full bg-white/80 shadow-sm shadow-white" />
            )}
          </button>
        ))}
        <button onClick={load} disabled={loading}
          className={cn(
            "py-4 mt-3 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2",
            "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg shadow-purple-500/30",
            "hover:from-violet-500 hover:to-purple-600 hover:shadow-purple-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}>
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {tr("game_loading")}
            </>
          ) : (
            <><Grid3x3 className="w-5 h-5" /> Krossvord yaratish</>
          )}
        </button>
      </div>
    </div>
  );

  // ── Game screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Navbar */}
      <nav className="bg-[#0d1120]/90 backdrop-blur-sm border-b border-white/5 px-4 h-14 flex items-center gap-3 sticky top-0 z-20">
        <Link href="/games" className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Grid3x3 className="w-4 h-4 text-purple-400" />
        <span className="font-bold text-white flex-1 text-sm">{tr("game_crossword")}</span>

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-400">{solved.size}/{clues.length}</span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">{coinsEarned}</span>
        </div>

        <button onClick={revealCell} disabled={!selected} title="Hujayrani ochish"
          className="p-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 disabled:opacity-20 transition-colors border border-cyan-500/20">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => { setGrid([]); setClues([]); }}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-3 py-4 flex flex-col xl:flex-row gap-4">

        {/* Left: Grid + active clue banner */}
        <div className="flex-1 min-w-0">
          {/* Active clue banner */}
          <div className={cn(
            "mb-3 rounded-xl border p-3 text-sm transition-all duration-300",
            activeClue
              ? "bg-violet-950/60 border-violet-500/30 text-violet-100"
              : "bg-white/5 border-white/5 text-slate-500"
          )}>
            {activeClue ? (
              <span>
                <span className="font-black text-violet-300">{activeClue.number}</span>
                <span className="mx-1 text-violet-400 font-bold">{activeClue.direction === "across" ? "→" : "↓"}</span>
                {activeClue.clue}
              </span>
            ) : (
              <span className="text-slate-500">Hujayrani bosing...</span>
            )}
          </div>

          {/* Grid */}
          <div className="overflow-auto rounded-2xl border border-white/5 bg-[#0d1120] p-3">
            <div className="inline-block">
              {grid.slice(minR, maxR + 1).map((row, ri) => (
                <div key={ri} className="flex">
                  {row.slice(minC, maxC + 1).map((cell, ci) => {
                    const r = ri + minR, c = ci + minC;
                    const key = `${r}-${c}`;
                    const isBlack = cell === "#" || cell === "";
                    const isSelected = selected?.row === r && selected?.col === c;
                    const isActive = activeCells.has(key);
                    const clueOfCell = clues.find(cl => {
                      for (let i = 0; i < cl.length; i++) {
                        const cr = cl.row + (cl.direction === "down" ? i : 0);
                        const cc = cl.col + (cl.direction === "across" ? i : 0);
                        if (cr === r && cc === c) return true;
                      }
                      return false;
                    });
                    const isSolvedCell = clueOfCell ? solved.has(clueOfCell.number) : false;
                    const isJustSolved = clueOfCell ? justSolved.has(clueOfCell.number) : false;
                    const isRevealed = revealed.has(key);
                    const clueNum = clueNumbers.get(key);

                    return (
                      <div key={ci}
                        onClick={() => !isBlack && handleCellClick(r, c)}
                        className={cn(
                          "relative w-9 h-9 sm:w-10 sm:h-10 border transition-all duration-150 cursor-pointer select-none",
                          isBlack
                            ? "bg-[#060810] border-[#0d1120] cursor-default"
                            : isSelected
                            ? "bg-amber-400/90 border-amber-300 shadow-sm shadow-amber-400/50 z-10"
                            : isJustSolved
                            ? "bg-emerald-400/80 border-emerald-300 shadow-sm shadow-emerald-400/60 animate-pulse"
                            : isSolvedCell
                            ? "bg-emerald-900/50 border-emerald-700/40"
                            : isActive
                            ? "bg-violet-900/70 border-violet-600/50"
                            : "bg-[#111827] border-white/8 hover:bg-white/10"
                        )}>
                        {!isBlack && (
                          <>
                            {clueNum && (
                              <span className={cn(
                                "absolute top-0 left-0.5 text-[7px] leading-none font-bold pointer-events-none",
                                isSelected ? "text-black/60" : isSolvedCell ? "text-emerald-400/70" : "text-slate-500"
                              )}>
                                {clueNum}
                              </span>
                            )}
                            <input
                              ref={el => { if (el) inputRefs.current[key] = el; }}
                              maxLength={1}
                              value={userGrid[r]?.[c] || ""}
                              onChange={e => handleInput(r, c, e.target.value)}
                              onKeyDown={e => handleKeyDown(r, c, e)}
                              onClick={() => handleCellClick(r, c)}
                              className={cn(
                                "w-full h-full text-center text-xs font-black bg-transparent outline-none uppercase caret-transparent",
                                isSelected
                                  ? "text-black"
                                  : isRevealed
                                  ? "text-cyan-300"
                                  : isSolvedCell
                                  ? "text-emerald-300"
                                  : isActive
                                  ? "text-violet-100"
                                  : "text-white"
                              )}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile progress */}
          <div className="flex sm:hidden items-center gap-2 mt-3 px-1">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-400">{solved.size}/{clues.length}</span>
          </div>
        </div>

        {/* Right: Clues panel */}
        <div className="xl:w-72 space-y-4">
          {/* Win banner */}
          {allSolved && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 pointer-events-none" />
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-200 font-black text-lg">Krossvord yechildi!</p>
              <p className="text-emerald-400 text-sm mt-1">+{coinsEarned} Chaqa</p>
            </div>
          )}

          {(["across", "down"] as const).map(dir => (
            <div key={dir}
              className="bg-[#0d1120] border border-white/5 rounded-2xl overflow-hidden">
              <div className={cn(
                "px-4 py-2.5 flex items-center gap-2 border-b border-white/5",
                dir === "across" ? "bg-violet-900/20" : "bg-indigo-900/20"
              )}>
                <span className={cn("text-sm font-black", dir === "across" ? "text-violet-300" : "text-indigo-300")}>
                  {dir === "across" ? "→" : "↓"}
                </span>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {dir === "across" ? "Gorizontal" : "Vertikal"}
                </h3>
                <span className="ml-auto text-xs text-slate-600">
                  {clues.filter(c => c.direction === dir && solved.has(c.number)).length}/{clues.filter(c => c.direction === dir).length}
                </span>
              </div>
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {clues.filter(c => c.direction === dir).map(c => (
                  <button key={c.number}
                    onClick={() => { setActiveClue(c); setSelected({ row: c.row, col: c.col }); inputRefs.current[`${c.row}-${c.col}`]?.focus(); }}
                    className={cn(
                      "w-full text-left text-xs px-3 py-2 rounded-xl transition-all duration-150 flex items-start gap-2",
                      activeClue?.number === c.number && activeClue?.direction === dir
                        ? "bg-violet-600/30 text-violet-100 border border-violet-500/30"
                        : solved.has(c.number)
                        ? "bg-emerald-900/20 text-emerald-500/60 line-through border border-transparent"
                        : "text-slate-300 hover:bg-white/5 border border-transparent"
                    )}>
                    <span className={cn(
                      "font-black shrink-0 mt-0.5",
                      activeClue?.number === c.number && activeClue?.direction === dir ? "text-violet-300" : "text-slate-500"
                    )}>
                      {c.number}.
                    </span>
                    <span className="leading-snug">{c.clue}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
