"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, Sparkles, Brain, Zap, MessageSquare,
  Languages, Volume2, ToggleLeft, Lightbulb, RotateCcw, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Personality  = "academic" | "friendly" | "concise";
type ResponseLen  = "short" | "medium" | "long";
type TutorLang    = "uz" | "ru" | "en" | "qq";

interface TutorSettings {
  personality:    Personality;
  language:       TutorLang;
  responseLength: ResponseLen;
  autoSuggest:    boolean;
  voiceLang:      "uz" | "ru" | "en";
}

const DEFAULTS: TutorSettings = {
  personality:    "friendly",
  language:       "uz",
  responseLength: "medium",
  autoSuggest:    true,
  voiceLang:      "uz",
};

// ── Card select group ─────────────────────────────────────────────────────────

function CardGroup<T extends string>({
  icon,
  title,
  desc,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  value: T;
  options: { value: T; icon?: React.ReactNode; label: string; sub?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <section className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-violet-400">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{title}</p>
          {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-start gap-1 px-4 py-3.5 rounded-xl border-2 text-left transition-all",
              value === opt.value
                ? "border-violet-500 bg-violet-500/10 text-white"
                : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              {opt.icon && <span className={cn("text-sm", value === opt.value ? "opacity-100" : "opacity-60")}>{opt.icon}</span>}
              <span className="font-semibold text-sm flex-1">{opt.label}</span>
              {value === opt.value && (
                <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            {opt.sub && <span className="text-[11px] text-slate-500 leading-snug pl-0">{opt.sub}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────────

function ToggleSection({ icon, title, desc, value, onChange }: {
  icon: React.ReactNode; title: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <section className="bg-slate-800 border border-slate-700/60 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-violet-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white text-sm">{title}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
          value ? "bg-violet-600" : "bg-slate-600"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
          value ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiTutorSettingsPage() {
  const [settings, setSettings] = useState<TutorSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-tutor-settings");
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const update = <K extends keyof TutorSettings>(key: K, val: TutorSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("ai-tutor-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem("ai-tutor-settings");
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/ai-tutor"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">AI Tutor Sozlamalari</span>
          </div>
          {saved && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Saqlandi
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-5 shadow-lg shadow-violet-500/20">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">AI Tutor Sozlamalari</h1>
              <p className="text-violet-200 text-xs mt-0.5">O'qituvchi uslubi va tilini moslang</p>
            </div>
          </div>
        </div>

        {/* Personality */}
        <CardGroup<Personality>
          icon={<Brain className="w-4 h-4" />}
          title="Tutor uslubi"
          desc="AI o'qituvchi qanday uslubda javob berishi"
          value={settings.personality}
          onChange={(v) => update("personality", v)}
          options={[
            { value: "friendly", icon: "😊", label: "Do'stona",  sub: "Sodda, misollar bilan, motivatsiya bilan" },
            { value: "academic", icon: "🎓", label: "Akademik",   sub: "Rasmiy, ilmiy terminologiya, batafsil" },
            { value: "concise",  icon: <Zap className="w-3.5 h-3.5" />, label: "Qisqa", sub: "Faqat asosiy fikr, vaqtni tejash" },
          ]}
        />

        {/* Response length */}
        <CardGroup<ResponseLen>
          icon={<MessageSquare className="w-4 h-4" />}
          title="Javob uzunligi"
          desc="Har bir javob qanchalik batafsil bo'lishi"
          value={settings.responseLength}
          onChange={(v) => update("responseLength", v)}
          options={[
            { value: "short",  label: "Qisqa",  sub: "1–2 gap" },
            { value: "medium", label: "O'rta",  sub: "3–5 gap (tavsiya)" },
            { value: "long",   label: "Uzun",   sub: "Keng tushuntirma" },
          ]}
        />

        {/* Language */}
        <CardGroup<TutorLang>
          icon={<Languages className="w-4 h-4" />}
          title="Javob tili"
          desc="AI qaysi tilda javob berishi"
          value={settings.language}
          onChange={(v) => update("language", v)}
          options={[
            { value: "uz", label: "O'zbek",     sub: "O'zbek tilida" },
            { value: "ru", label: "Русский",    sub: "Russian" },
            { value: "en", label: "English",    sub: "Ingliz tilida" },
            { value: "qq", label: "Qaraqalpaq", sub: "Qaraqalpaq tilinde" },
          ]}
        />

        {/* Voice language */}
        <CardGroup<"uz" | "ru" | "en">
          icon={<Volume2 className="w-4 h-4" />}
          title="Ovozli kiritish tili"
          desc="Mikrofon orqali yozganda qaysi til taniladi"
          value={settings.voiceLang ?? "uz"}
          onChange={(v) => update("voiceLang", v)}
          options={[
            { value: "uz", label: "O'zbek",  sub: "uz-UZ" },
            { value: "ru", label: "Русский", sub: "ru-RU" },
            { value: "en", label: "English", sub: "en-US" },
          ]}
        />

        {/* Auto suggest */}
        <ToggleSection
          icon={<ToggleLeft className="w-4 h-4" />}
          title="Tavsiya etilgan savollar"
          desc="Suhbat boshida tez savollar ko'rsatilsin"
          value={settings.autoSuggest}
          onChange={(v) => update("autoSuggest", v)}
        />

        {/* Tip */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Maslahat: </span>
            "Do'stona" uslub yangi o'quvchilar uchun, "Akademik" imtihon tayyorgarligida,
            "Qisqa" esa tez takrorlash uchun eng qulay. Sozlamalar avtomatik saqlanadi.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg",
              saved
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20"
            )}
          >
            {saved
              ? <><Check className="w-4 h-4" /> Saqlandi!</>
              : <><Save className="w-4 h-4" /> Saqlash</>}
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Standart
          </button>
        </div>

      </main>
    </div>
  );
}
