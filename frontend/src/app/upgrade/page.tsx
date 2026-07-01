"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Crown, Zap, X } from "lucide-react";
import { useLang } from "@/lib/lang";
import { LangToggle } from "@/components/ui/LangToggle";

// ── Self-contained i18n for the pricing mockup (uz / ru / en / qq) ──────────────
type Lang = "uz" | "ru" | "en" | "qq";

interface Tier {
  id: string;
  name: string;
  tagline: string;
  price: string;      // "0" or a number string in UZS
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
  current?: boolean;
}

interface Copy {
  back: string;
  badge: string;
  title: string;
  subtitle: string;
  mockNote: string;
  perMonth: string;
  free: string;
  popular: string;
  soonTitle: string;
  soonBody: string;
  soonClose: string;
  tiers: Tier[];
}

const CONTENT: Record<Lang, Copy> = {
  uz: {
    back: "Orqaga",
    badge: "Rejalar",
    title: "O'zingizga mos rejani tanlang",
    subtitle: "AbituriyentAI bilan imtihonga yanada kuchli tayyorlaning. Istalgan vaqtda bekor qiling.",
    mockNote: "Diqqat: bu — namoyish sahifasi. To'lov tizimi hali faollashtirilmagan.",
    perMonth: "/oy",
    free: "so'm",
    popular: "Eng ommabop",
    soonTitle: "Tez kunda!",
    soonBody: "To'lov tizimi hozircha ishlab chiqilmoqda. Tez orada rejalarni sotib olishingiz mumkin bo'ladi.",
    soonClose: "Tushundim",
    tiers: [
      { id: "free", name: "Bepul", tagline: "Boshlash uchun", price: "0", period: "/oy", cta: "Joriy reja", current: true,
        features: ["Kuniga 5 ta AI-savol", "Asosiy darslar va testlar", "3 ta ta'lim o'yini", "Reyting jadvali", "Bitta fan bo'yicha mashq"] },
      { id: "pro", name: "Pro", tagline: "Jiddiy abituriyentlar uchun", price: "39 000", period: "/oy", cta: "Pro'ni tanlash", popular: true,
        features: ["Cheksiz AI-repetitor", "Barcha 14 o'yin + ovozli effektlar", "To'liq DTM simulyatsiyasi", "Shaxsiy tahlil va zaif mavzular", "Reklamasiz", "Abituriyent huquqlari (appellyatsiya)"] },
      { id: "premium", name: "Premium", tagline: "Maksimal natija uchun", price: "89 000", period: "/oy", cta: "Premium'ni tanlash",
        features: ["Pro'dagi barcha imkoniyatlar", "AI shaxsiy o'quv reja", "Cheksiz Canvas infografika", "Ustuvor qo'llab-quvvatlash", "Ota-ona / o'qituvchi paneli", "Yakuniy sertifikat"] },
    ],
  },
  ru: {
    back: "Назад",
    badge: "Тарифы",
    title: "Выберите подходящий тариф",
    subtitle: "Готовьтесь к экзамену эффективнее с AbituriyentAI. Отменить можно в любой момент.",
    mockNote: "Внимание: это демо-страница. Оплата пока не подключена.",
    perMonth: "/мес",
    free: "сум",
    popular: "Популярный",
    soonTitle: "Скоро!",
    soonBody: "Система оплаты пока в разработке. Совсем скоро вы сможете приобрести тариф.",
    soonClose: "Понятно",
    tiers: [
      { id: "free", name: "Бесплатно", tagline: "Для начала", price: "0", period: "/мес", cta: "Текущий тариф", current: true,
        features: ["5 AI-вопросов в день", "Базовые уроки и тесты", "3 обучающие игры", "Таблица лидеров", "Практика по одному предмету"] },
      { id: "pro", name: "Pro", tagline: "Для серьёзных абитуриентов", price: "39 000", period: "/мес", cta: "Выбрать Pro", popular: true,
        features: ["Безлимитный AI-репетитор", "Все 14 игр + звуковые эффекты", "Полная симуляция экзамена", "Личная аналитика и слабые темы", "Без рекламы", "Права абитуриента (апелляция)"] },
      { id: "premium", name: "Premium", tagline: "Для максимального результата", price: "89 000", period: "/мес", cta: "Выбрать Premium",
        features: ["Всё из тарифа Pro", "Персональный AI-план обучения", "Безлимитная Canvas-инфографика", "Приоритетная поддержка", "Панель для родителей / учителей", "Итоговый сертификат"] },
    ],
  },
  en: {
    back: "Back",
    badge: "Plans",
    title: "Choose the plan that fits you",
    subtitle: "Prepare for the exam more powerfully with AbituriyentAI. Cancel anytime.",
    mockNote: "Note: this is a demo page. Payments are not enabled yet.",
    perMonth: "/mo",
    free: "UZS",
    popular: "Most popular",
    soonTitle: "Coming soon!",
    soonBody: "The payment system is still in development. You'll be able to purchase plans very soon.",
    soonClose: "Got it",
    tiers: [
      { id: "free", name: "Free", tagline: "To get started", price: "0", period: "/mo", cta: "Current plan", current: true,
        features: ["5 AI questions per day", "Basic lessons and tests", "3 educational games", "Leaderboard", "Practice in one subject"] },
      { id: "pro", name: "Pro", tagline: "For serious applicants", price: "39,000", period: "/mo", cta: "Choose Pro", popular: true,
        features: ["Unlimited AI tutor", "All 14 games + sound effects", "Full exam simulation", "Personal analytics & weak topics", "Ad-free", "Applicant rights (appeals)"] },
      { id: "premium", name: "Premium", tagline: "For maximum results", price: "89,000", period: "/mo", cta: "Choose Premium",
        features: ["Everything in Pro", "AI personal study plan", "Unlimited Canvas infographics", "Priority support", "Parent / teacher portal", "Completion certificate"] },
    ],
  },
  qq: {
    back: "Artqa",
    badge: "Tariflar",
    title: "Ózińizge say tarifti saylań",
    subtitle: "AbituriyentAI menen imtixanǵa kúshlirek tayarlanıń. Qálegen waqıtta biykarlań.",
    mockNote: "Itibar: bul — kórsetiw beti. Tólew sisteması ele qosılmaǵan.",
    perMonth: "/ay",
    free: "swm",
    popular: "Eń ataqlı",
    soonTitle: "Tez arada!",
    soonBody: "Tólew sisteması ele islep shıǵılıp atır. Tez arada tariflardı satıp alıwıńız múmkin boladı.",
    soonClose: "Túsindim",
    tiers: [
      { id: "free", name: "Tegin", tagline: "Baslaw ushın", price: "0", period: "/ay", cta: "Házirgi tarif", current: true,
        features: ["Kúnine 5 AI-soraw", "Tiykarǵı sabaqlar hám testler", "3 tálim oyını", "Reyting kestesi", "Bir pán boyınsha shınıǵıw"] },
      { id: "pro", name: "Pro", tagline: "Jaqsı abituriyentler ushın", price: "39 000", period: "/ay", cta: "Pro'nı saylaw", popular: true,
        features: ["Sheksiz AI-repetitor", "Barlıq 14 oyın + dawıs effektleri", "Tolıq imtixan simulyaciyası", "Jeke analitika hám kúshsiz temalar", "Reklamasız", "Abituriyent huqıqları (appellyaciya)"] },
      { id: "premium", name: "Premium", tagline: "Maksimal nátiyje ushın", price: "89 000", period: "/ay", cta: "Premium'di saylaw",
        features: ["Pro'daǵı barlıq múmkinshilikler", "AI jeke oqıw rejesi", "Sheksiz Canvas infografika", "Ustın qollap-quwatlaw", "Ata-ana / muǵallim paneli", "Juwmaqlawshı sertifikat"] },
    ],
  },
};

const TIER_ICON: Record<string, React.ReactNode> = {
  free: <Zap className="w-5 h-5" />,
  pro: <Sparkles className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
};

export default function UpgradePage() {
  const { lang } = useLang();
  const c = CONTENT[(["uz", "ru", "en", "qq"].includes(lang) ? lang : "uz") as Lang];
  const [soonOpen, setSoonOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-slate-900">{c.back}</span>
          <div className="ml-auto"><LangToggle /></div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-14 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4" />
          {c.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight">{c.title}</h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">{c.subtitle}</p>
      </div>

      {/* Tiers */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {c.tiers.map((tier) => {
            const highlighted = tier.popular;
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all ${
                  highlighted
                    ? "border-violet-400 shadow-xl shadow-violet-500/10 md:-translate-y-2 ring-1 ring-violet-200"
                    : "border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                    ⭐ {c.popular}
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  tier.id === "premium" ? "bg-amber-100 text-amber-600"
                  : tier.id === "pro" ? "bg-violet-100 text-violet-600"
                  : "bg-slate-100 text-slate-500"
                }`}>
                  {TIER_ICON[tier.id]}
                </div>

                <h2 className="text-xl font-black text-slate-900">{tier.name}</h2>
                <p className="text-slate-500 text-sm mb-4">{tier.tagline}</p>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-black text-slate-900">{tier.price}</span>
                  <span className="text-slate-500 text-sm font-medium">{tier.price === "0" ? "" : c.free}{tier.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? "text-violet-600" : "text-emerald-500"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { if (!tier.current) setSoonOpen(true); }}
                  disabled={tier.current}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    tier.current
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : highlighted
                        ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90 shadow-md"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">{c.mockNote}</p>
      </div>

      {/* "Coming soon" mock modal */}
      {soonOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSoonOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{c.soonTitle}</h3>
            <p className="text-sm text-slate-600 mb-5">{c.soonBody}</p>
            <button onClick={() => setSoonOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
              {c.soonClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
