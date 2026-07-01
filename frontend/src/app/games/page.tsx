"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Volume2, VolumeX, Clock, Zap, GraduationCap, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang";
import { useUserProfile } from "@/lib/queries";
import { playSound, isSoundMuted, toggleSoundMuted } from "@/lib/sound";

function ChaqaCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1"/>
      <circle cx="10" cy="10" r="7" fill="#e2e8f0"/>
      <text x="10" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#475569" fontFamily="system-ui, sans-serif">C</text>
    </svg>
  );
}

type Cat = "compete" | "practice";

interface Game {
  href: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  gradient: string;
  coins: number;
  time: string;
  badge: string | null;
  badgeColor: string;
  cat: Cat;
}

const GAMES: Game[] = [
  { href: "/games/kim-bolmoqchi", emoji: "🎯", titleKey: "game_kim",       descKey: "game_kim_desc",       gradient: "from-yellow-400 via-orange-500 to-red-500",   coins: 50, time: "15 min", badge: "HOT",    badgeColor: "bg-red-500",    cat: "compete"  },
  { href: "/games/lightning",     emoji: "⚡", titleKey: "game_lightning", descKey: "game_lightning_desc", gradient: "from-yellow-400 via-amber-500 to-orange-500", coins: 30, time: "2 min",  badge: "YANGI",  badgeColor: "bg-violet-600", cat: "compete"  },
  { href: "/games/countdown",     emoji: "⏱️", titleKey: "game_countdown", descKey: "game_countdown_desc", gradient: "from-rose-500 via-pink-500 to-fuchsia-500",   coins: 25, time: "1 min",  badge: "YANGI",  badgeColor: "bg-violet-600", cat: "compete"  },
  { href: "/games/chain",         emoji: "🔗", titleKey: "game_chain",     descKey: "game_chain_desc",     gradient: "from-cyan-500 via-sky-500 to-blue-600",       coins: 20, time: "∞",      badge: "YANGI",  badgeColor: "bg-violet-600", cat: "compete"  },
  { href: "/games/last-stand",    emoji: "🛡️", titleKey: "game_laststand", descKey: "game_laststand_desc", gradient: "from-violet-500 via-purple-500 to-indigo-600", coins: 40, time: "∞",      badge: "YANGI",  badgeColor: "bg-violet-600", cat: "compete"  },
  { href: "/games/speed-quiz",    emoji: "🚀", titleKey: "game_speedquiz", descKey: "game_speedquiz_desc", gradient: "from-orange-500 via-red-500 to-pink-600",     coins: 25, time: "4 min",  badge: "TEZKOR", badgeColor: "bg-orange-500",  cat: "compete"  },
  { href: "/games/flashcards",    emoji: "🃏", titleKey: "game_flashcards", descKey: "game_flashcards_desc", gradient: "from-blue-500 via-blue-600 to-indigo-600",   coins: 10, time: "5 min",  badge: null,     badgeColor: "",              cat: "practice" },
  { href: "/games/true-false",    emoji: "✅", titleKey: "game_truefalse", descKey: "game_truefalse_desc", gradient: "from-amber-400 via-yellow-500 to-orange-400", coins: 20, time: "2 min",  badge: null,     badgeColor: "",              cat: "practice" },
  { href: "/games/fill-blank",    emoji: "✏️", titleKey: "game_fillblank", descKey: "game_fillblank_desc", gradient: "from-emerald-500 via-teal-500 to-cyan-500",   coins: 20, time: "5 min",  badge: "AI",     badgeColor: "bg-fuchsia-600", cat: "practice" },
  { href: "/games/matching",      emoji: "🧩", titleKey: "game_matching",  descKey: "game_matching_desc",  gradient: "from-green-500 via-emerald-500 to-teal-600",  coins: 20, time: "5 min",  badge: "AI",     badgeColor: "bg-fuchsia-600", cat: "practice" },
  { href: "/games/scramble",      emoji: "🔀", titleKey: "game_scramble",  descKey: "game_scramble_desc",  gradient: "from-cyan-500 via-sky-500 to-blue-600",       coins: 15, time: "3 min",  badge: null,     badgeColor: "",              cat: "practice" },
  { href: "/games/crossword",     emoji: "📝", titleKey: "game_crossword", descKey: "game_crossword_desc", gradient: "from-purple-500 via-violet-500 to-indigo-600", coins: 30, time: "10 min", badge: "AI",     badgeColor: "bg-fuchsia-600", cat: "practice" },
  { href: "/games/hangman",       emoji: "🔤", titleKey: "game_hangman",   descKey: "game_hangman_desc",   gradient: "from-rose-500 via-pink-500 to-fuchsia-500",   coins: 15, time: "3 min",  badge: "AI",     badgeColor: "bg-fuchsia-600", cat: "practice" },
  { href: "/games/memory",        emoji: "🧠", titleKey: "game_memory",    descKey: "game_memory_desc",    gradient: "from-violet-500 via-purple-500 to-fuchsia-600", coins: 10, time: "3 min",  badge: null,     badgeColor: "",              cat: "practice" },
];

function GameTile({ game }: { game: Game }) {
  const { tr } = useLang();
  return (
    <Link
      href={game.href}
      onClick={() => playSound("click")}
      className="group relative flex flex-col rounded-2xl bg-slate-800/70 border border-slate-700/60 p-4 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-800 hover:shadow-xl hover:shadow-black/30 active:translate-y-0"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity`} />
      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-xl shadow-lg`}>
            {game.emoji}
          </div>
          {game.badge && (
            <span className={`${game.badgeColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider`}>
              {game.badge}
            </span>
          )}
        </div>
        <h3 className="font-bold text-white text-sm leading-tight mb-0.5 group-hover:text-violet-300 transition-colors">
          {tr(game.titleKey)}
        </h3>
        <p className="hidden sm:block text-slate-400 text-[11px] leading-snug line-clamp-2 mb-3">
          {tr(game.descKey)}
        </p>
        <div className="mt-auto flex items-center justify-between text-[11px] pt-2">
          <span className="flex items-center gap-1 font-bold text-amber-300/90">
            <ChaqaCoin className="w-3 h-3" />+{game.coins}
          </span>
          <span className="flex items-center gap-0.5 text-slate-500">
            <Clock className="w-3 h-3" />{game.time}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-8">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</h2>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

export default function GamesPage() {
  const { tr } = useLang();
  const { data: profile } = useUserProfile();
  const [muted, setMuted] = useState(false);

  useEffect(() => setMuted(isSoundMuted()), []);

  function handleToggleSound() {
    const next = toggleSoundMuted();
    setMuted(next);
    if (!next) playSound("coin");
  }

  const featured = GAMES.find((g) => g.href === "/games/kim-bolmoqchi")!;
  const compete = GAMES.filter((g) => g.cat === "compete" && g !== featured);
  const practice = GAMES.filter((g) => g.cat === "practice");

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Gamepad2 className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white text-sm sm:text-base">{tr("games_title")}</span>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleToggleSound}
              aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            {profile && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-2.5 sm:px-3 py-1.5">
                  <ChaqaCoin className="w-4 h-4" />
                  <span className="text-sm font-bold text-white">{profile.coins}</span>
                  <span className="hidden sm:inline text-xs text-slate-400">Chaqa</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-2.5 sm:px-3 py-1.5">
                  <span className="text-sm">🪙</span>
                  <span className="text-sm font-bold text-amber-300">{profile.oxforder_tanga ?? 0}</span>
                  <span className="hidden sm:inline text-xs text-slate-400">Tanga</span>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <Gamepad2 className="w-4 h-4 text-violet-400" />
          <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">Ta&apos;lim o&apos;yinlari</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">O&apos;yin orqali o&apos;rgan 🎮</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          BMBA fanlarini o&apos;yin formatida o&apos;rganib Chaqa yig&apos;ing
        </p>
      </div>

      {/* Featured */}
      <div className="max-w-5xl mx-auto px-4">
        <Link
          href={featured.href}
          onClick={() => playSound("whoosh")}
          className="group relative block rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-5 sm:p-6 hover:shadow-2xl hover:shadow-orange-500/30 transition-all"
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="text-5xl sm:text-7xl">🎯</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">🔥 HOT</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">15 min</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white mb-1 truncate">{tr("game_kim")}</h2>
              <p className="text-orange-100 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{tr("game_kim_desc")}</p>
              <div className="flex items-center gap-2">
                <ChaqaCoin className="w-4 h-4" />
                <span className="text-white font-bold text-sm">+50 Chaqa</span>
              </div>
            </div>
            <ChevronRight className="hidden sm:block w-7 h-7 text-white/80 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Compete */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <SectionHeader icon={<Zap className="w-4 h-4" />} label="Tezkor musobaqa" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {compete.map((g) => <GameTile key={g.href} game={g} />)}
        </div>

        {/* Practice */}
        <SectionHeader icon={<GraduationCap className="w-4 h-4" />} label="Mashq o'yinlari" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-12">
          {practice.map((g) => <GameTile key={g.href} game={g} />)}
        </div>
      </div>
    </div>
  );
}
