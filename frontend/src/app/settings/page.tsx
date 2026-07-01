"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Settings, Globe, Bell, CalendarDays,
  User, LogOut, ChevronRight, Check, Shield, Users, Copy,
} from "lucide-react";
import { isAuthenticated, removeToken, api } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { useUserProfile } from "@/lib/queries";
import { LangToggle } from "@/components/ui/LangToggle";
import { NotificationToggle } from "@/components/notifications/NotificationToggle";

function defaultExamDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

function SettingsSection({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function SettingsRow({ label, desc, action }: {
  label: string; desc?: string; action: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { tr } = useLang();
  const { data: profile } = useUserProfile();

  const [examDate, setExamDate] = useState(defaultExamDate);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    const stored = localStorage.getItem("bmba_exam_date") || localStorage.getItem("dtm_exam_date");
    if (stored) setExamDate(stored);
  }, [router]);

  function handleExamDateSave(d: string) {
    setExamDate(d);
    localStorage.setItem("bmba_exam_date", d);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    removeToken();
    router.push("/");
  }

  const [parentToken, setParentToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState<string | null>(null);

  async function handleGetParentToken() {
    setParentLoading(true);
    setParentError(null);
    try {
      const res = await api.get("/parent/my-token");
      setParentToken(res.data.share_url);
    } catch {
      setParentError("Havola olishda xatolik. Backend ishlaayotganini tekshiring.");
    } finally {
      setParentLoading(false);
    }
  }

  function copyToken() {
    if (!parentToken) return;
    navigator.clipboard.writeText(parentToken).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Settings className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">{tr("settings_title")}</span>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              {tr("settings_saved")}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Account info ── */}
        {profile && (
          <Link href="/profile" className="block bg-white rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{profile.username}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                <p className="text-xs text-blue-600 mt-0.5">{tr("level")} {profile.level} · {profile.coins} 🥈 Chaqa · {profile.oxforder_tanga ?? 0} 🪙 Tanga</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* ── Language ── */}
        <SettingsSection title={tr("settings_language")} icon={<Globe className="w-4 h-4" />}>
          <SettingsRow
            label={tr("settings_language")}
            desc={tr("settings_language_desc")}
            action={<LangToggle />}
          />
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection title={tr("settings_notif")} icon={<Bell className="w-4 h-4" />}>
          <SettingsRow
            label={tr("settings_notif")}
            desc={tr("settings_notif_desc")}
            action={<NotificationToggle />}
          />
        </SettingsSection>

        {/* ── Exam date ── */}
        <SettingsSection title={tr("settings_exam_date")} icon={<CalendarDays className="w-4 h-4" />}>
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-slate-800 mb-1">{tr("settings_exam_date")}</p>
            <p className="text-xs text-slate-500 mb-3">{tr("settings_exam_desc")}</p>
            <input
              type="date"
              value={examDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => handleExamDateSave(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full sm:w-auto"
            />
          </div>
        </SettingsSection>

        {/* ── Quick links ── */}
        <SettingsSection title={tr("settings_data")} icon={<Shield className="w-4 h-4" />}>
          <Link href="/progress" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-800">{tr("nav_progress")}</p>
              <p className="text-xs text-slate-500">{tr("profile_subject_progress")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/bookmarks" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-800">{tr("nav_bookmarks")}</p>
              <p className="text-xs text-slate-500">{tr("profile_exams_taken")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/leaderboard" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-800">{tr("nav_leaderboard")}</p>
              <p className="text-xs text-slate-500">{tr("profile_avg_score")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </SettingsSection>

        {/* ── Parent / Teacher access ── */}
        <SettingsSection title="Ota-ona / O'qituvchi kirishi" icon={<Users className="w-4 h-4" />}>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Ota-ona yoki o'qituvchingiz sizning o'quv taraqqiyotingizni ko'rishi uchun
              ulashish havolasini yuboring. Ular faqat o'qish huquqiga ega.
            </p>
            {!parentToken ? (
              <>
                <button onClick={handleGetParentToken} disabled={parentLoading}
                  className="w-full py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 font-semibold text-sm hover:bg-violet-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {parentLoading
                    ? <><span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> Yuklanmoqda...</>
                    : <><Users className="w-4 h-4" /> Ulashish havolasini olish</>}
                </button>
                {parentError && <p className="text-xs text-red-500 mt-1 text-center">{parentError}</p>}
                <Link href="/parent" className="block text-center text-xs text-violet-500 hover:underline mt-1">
                  → Ota-ona portaliga o'tish
                </Link>
              </>
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-mono break-all select-all">
                  {parentToken}
                </div>
                <button onClick={copyToken}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  {tokenCopied ? <><Check className="w-4 h-4 text-emerald-500" /> Nusxalandi!</> : <><Copy className="w-4 h-4" /> Nusxa olish</>}
                </button>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* ── Danger zone ── */}
        <SettingsSection title={tr("settings_danger")} icon={<LogOut className="w-4 h-4 text-red-500" />}>
          <div className="px-5 py-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              {tr("settings_logout")}
            </button>
          </div>
        </SettingsSection>

        <p className="text-center text-xs text-slate-400 pb-4">
          AbituriyentAI · BMBA 2026
        </p>
      </main>
    </div>
  );
}
