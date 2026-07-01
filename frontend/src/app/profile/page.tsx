"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Camera, Pencil, Check, X, RefreshCw,
  Trophy, BookOpen, TrendingUp, Star, Flame, Clock, Settings,
} from "lucide-react";
import { useUserProfile, useExamHistory, queryKeys } from "@/lib/queries";
import { isAuthenticated, userApi } from "@/lib/api";
import { uploadAvatar } from "@/lib/firebase";
import { useLang } from "@/lib/lang";
import { formatScore, formatDateTime } from "@/lib/utils";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
// ── Avatar colour palettes ────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  ["#3B82F6", "#6366F1"], // blue → indigo
  ["#8B5CF6", "#EC4899"], // purple → pink
  ["#10B981", "#0891B2"], // emerald → cyan
  ["#F59E0B", "#EF4444"], // amber → red
  ["#6366F1", "#8B5CF6"], // indigo → violet
  ["#EC4899", "#F97316"], // pink → orange
  ["#0891B2", "#3B82F6"], // cyan → blue
  ["#10B981", "#3B82F6"], // emerald → blue
  ["#F97316", "#EC4899"], // orange → pink
  ["#EF4444", "#8B5CF6"], // red → violet
  ["#14B8A6", "#6366F1"], // teal → indigo
  ["#84CC16", "#10B981"], // lime → emerald
  ["#F59E0B", "#8B5CF6"], // amber → violet
  ["#06B6D4", "#6366F1"], // sky → indigo
  ["#BE185D", "#7C3AED"], // pink → violet
  ["#16A34A", "#0891B2"], // green → cyan
] as const;

const AVATAR_PALETTE_KEY = "profile_avatar_palette";
const AVATAR_PHOTO_KEY   = "profile_avatar_photo";

function getStoredPaletteIdx(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(AVATAR_PALETTE_KEY);
  const n = v !== null ? parseInt(v, 10) : -1;
  return n >= 0 && n < AVATAR_PALETTES.length ? n : Math.floor(Math.random() * AVATAR_PALETTES.length);
}

function getStoredPhoto(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AVATAR_PHOTO_KEY);
}

// ── Level names ───────────────────────────────────────────────────────────────
const LEVEL_NAMES: Record<number, { uz: string; ru: string; en: string; qq: string }> = {
  1:  { uz: "Yangi abituriyent", ru: "Новый абитуриент", en: "New Student",   qq: "Jańa abituriyent" },
  2:  { uz: "O'rganuvchi",       ru: "Ученик",           en: "Learner",       qq: "Úyreniwshi" },
  3:  { uz: "Izlanuvchi",        ru: "Исследователь",    en: "Explorer",      qq: "Izleniwshi" },
  4:  { uz: "Bilimdon",          ru: "Знаток",           en: "Scholar",       qq: "Bilimlı" },
  5:  { uz: "Ustoz",             ru: "Мастер",           en: "Master",        qq: "Ustaz" },
  6:  { uz: "Ekspert",           ru: "Эксперт",          en: "Expert",        qq: "Ekspert" },
  7:  { uz: "Olim",              ru: "Учёный",           en: "Academic",      qq: "Ǵalım" },
  8:  { uz: "Professor",         ru: "Профессор",        en: "Professor",     qq: "Professor" },
  9:  { uz: "Akademik",          ru: "Академик",         en: "Academician",   qq: "Akademik" },
  10: { uz: "BMBA Ustasi",       ru: "Мастер БМБА",      en: "BMBA Master",   qq: "BMBA Ustazı" },
};

function getLevelName(level: number, lang: string): string {
  const entry = LEVEL_NAMES[Math.min(level, 10)];
  if (!entry) return `Level ${level}`;
  if (lang === "ru") return entry.ru;
  if (lang === "en") return entry.en;
  if (lang === "qq") return entry.qq;
  return entry.uz;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode; value: string | number; label: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router      = useRouter();
  const { tr, lang } = useLang();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useUserProfile();
  const { data: examHistory }        = useExamHistory();

  // Avatar state
  const [paletteIdx, setPaletteIdx] = useState<number>(0);
  const [photo, setPhoto]           = useState<string | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const [nameSaving, setNameSaving]   = useState(false);
  const [nameError, setNameError]     = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Load stored avatar preferences
  useEffect(() => {
    setPaletteIdx(getStoredPaletteIdx());
    setPhoto(getStoredPhoto());
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  // Randomize avatar
  function randomizePalette() {
    const next = (paletteIdx + 1 + Math.floor(Math.random() * (AVATAR_PALETTES.length - 1))) % AVATAR_PALETTES.length;
    setPaletteIdx(next);
    localStorage.setItem(AVATAR_PALETTE_KEY, String(next));
  }

  // Upload photo (Firebase Storage)
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
      // Upload to Firebase Storage
      const url = await uploadAvatar(profile.id, file);
      setPhoto(url);
      localStorage.setItem(AVATAR_PHOTO_KEY, url);
    } catch {
      // Fallback: keep local base64 already set via reader
    }
  }

  function removePhoto() {
    setPhoto(null);
    localStorage.removeItem(AVATAR_PHOTO_KEY);
  }

  // Name save
  async function saveName() {
    if (!nameInput.trim() || nameInput.trim() === profile?.username) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      await userApi.updateProfile(nameInput.trim());
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setNameError(detail ?? "Saqlashda xatolik");
    } finally {
      setNameSaving(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const palette  = AVATAR_PALETTES[paletteIdx];
  const xpPct    = Math.min(100, Math.round((profile.xp_in_current_level / 500) * 100));
  const initial  = profile.username.charAt(0).toUpperCase();
  const bestScore = examHistory?.length
    ? Math.max(...examHistory.map((e) => e.total_score)) : 0;
  const avgScore  = examHistory?.length
    ? examHistory.reduce((s, e) => s + e.total_score, 0) / examHistory.length : 0;

  const achievements = [
    { icon: "🏆", label: tr("profile_exams_taken"),   value: examHistory?.length ?? 0, threshold: 1 },
    { icon: "🔥", label: "Streak",                    value: profile.streak_days,       threshold: 3 },
    { icon: "🥈", label: "Chaqa",                     value: profile.xp,                threshold: 500 },
    { icon: "📚", label: tr("profile_lessons_done"),  value: profile.level * 3,         threshold: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Nav ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-slate-900">{tr("profile_title")}</span>
          {nameSuccess && (
            <span className="ml-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" /> Saqlandi
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="no-print text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors"
              title="Hisobotni yuklab olish"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Hisobot
            </button>
            <Link href="/settings" className="text-slate-400 hover:text-slate-600">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Avatar + identity card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Colour banner */}
          <div
            className="h-24 w-full"
            style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
          />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center"
                  style={photo ? {} : { background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
                >
                  {photo ? (
                    <img src={photo} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white select-none">{initial}</span>
                  )}
                </div>
                {/* Camera overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Rasm yuklash"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Avatar actions */}
              <div className="flex items-center gap-2 pb-1">
                {photo && (
                  <button
                    onClick={removePhoto}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    Rasmni olib tashlash
                  </button>
                )}
                <button
                  onClick={randomizePalette}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rang o'zgartirish
                </button>
              </div>
            </div>

            {/* Name + email */}
            <div className="space-y-1 mb-4">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    maxLength={50}
                    className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent flex-1 min-w-0 pb-0.5"
                  />
                  <button
                    onClick={saveName}
                    disabled={nameSaving}
                    className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-60"
                  >
                    {nameSaving
                      ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameError(null); }}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl font-bold text-slate-900">{profile.username}</h2>
                  <button
                    onClick={() => { setNameInput(profile.username); setEditingName(true); setNameError(null); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 text-slate-400 hover:text-blue-600 transition-all"
                    title="Ismni o'zgartirish"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>

            {/* Level badge + pills */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
              >
                {tr("level")} {profile.level} · {getLevelName(profile.level, lang)}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5" />
                {profile.streak_days} {tr("streak_day")}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full">
                🥈 {profile.coins} Chaqa
              </span>
              {(profile.oxforder_tanga ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-full">
                  🪙 {profile.oxforder_tanga} Tanga
                </span>
              )}
            </div>

            {/* XP progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{profile.xp_in_current_level} / 500 Chaqa</span>
                <span>{profile.xp_to_next_level} Chaqa {tr("xp_next_level")}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpPct}%`,
                    background: `linear-gradient(90deg, ${palette[0]}, ${palette[1]})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            value={examHistory?.length ?? 0}
            label={tr("profile_exams_taken")}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-blue-600" />}
            value={formatScore(bestScore)}
            label={tr("profile_best_score")}
            color="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            value={formatScore(avgScore)}
            label={tr("profile_avg_score")}
            color="bg-green-50"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            value={profile.level * 3}
            label={tr("profile_lessons_done")}
            color="bg-purple-50"
          />
        </div>

        {/* ── Achievements ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {tr("profile_achievements")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`rounded-xl p-3 border transition-colors ${
                  a.value >= a.threshold
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-slate-50 border-slate-100 opacity-50"
                }`}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="font-bold text-slate-800 text-sm">{a.value}</div>
                <div className="text-xs text-slate-500">{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent exams ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            {tr("profile_recent_exams")}
          </h3>
          {!examHistory?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">{tr("profile_no_exams")}</p>
          ) : (
            <div className="space-y-2">
              {examHistory.slice(0, 5).map((exam) => (
                <Link
                  key={exam.session_id}
                  href={`/exam/results/${exam.session_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      exam.percentage >= 55 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {exam.percentage >= 55 ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {formatScore(exam.total_score)} / {formatScore(exam.max_possible_score)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {exam.submitted_at ? formatDateTime(exam.submitted_at) : ""}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${exam.percentage >= 55 ? "text-green-600" : "text-red-500"}`}>
                    {exam.percentage.toFixed(0)}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          {tr("profile_joined")} {formatDateTime(profile.created_at)}
        </p>
      </main>
    </div>
  );
}
