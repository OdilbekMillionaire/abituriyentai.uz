"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  ArrowLeft, Send, Mic, MicOff, Paperclip, X, Settings,
  BookOpen, Sparkles, Trash2, Copy, Check,
  Loader2, Bot, ChevronDown, Zap, Brain, GraduationCap,
} from "lucide-react";
import { api, isAuthenticated } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  attachmentName?: string;
  timestamp: Date;
}

interface TutorResponse {
  answer: string;
  subject: string;
  model_used: string;
}

type TutorPersonality = "academic" | "friendly" | "concise";

interface TutorSettings {
  personality: TutorPersonality;
  language: string;
  responseLength: "short" | "medium" | "long";
}

// ── Subjects ──────────────────────────────────────────────────────────────────

const SUBJECTS: { value: Subject; label: string; emoji: string; gradient: string }[] = [
  { value: "MOTHER_TONGUE", label: "Ona tili",   emoji: "📚", gradient: "from-blue-500 to-cyan-400"    },
  { value: "MATHEMATICS",   label: "Matematika", emoji: "📐", gradient: "from-emerald-500 to-teal-400" },
  { value: "HISTORY",       label: "Tarix",      emoji: "🏛️", gradient: "from-amber-500 to-orange-400" },
];

const SUGGESTIONS: Record<Subject, string[]> = {
  MOTHER_TONGUE: [
    "Fe'lning zamonlari qanday farqlanadi?",
    "Ega va kesim orasidagi munosabat",
    "Sifat darajalari qanday hosil bo'ladi?",
    "Bir tarkibli gaplar haqida tushuntiring",
  ],
  MATHEMATICS: [
    "Kvadrat tenglama formulasini tushuntiring",
    "Logarifm va daraja orasidagi bog'liqlik",
    "Integralning geometrik ma'nosi nima?",
    "Trigonometrik tenglamalar qanday yechiladi?",
  ],
  HISTORY: [
    "Amir Temur davlati qachon tuzilgan?",
    "O'zbekiston mustaqilligining ahamiyati",
    "Ipak yo'li qanday rol o'ynagan?",
    "Jadidchilik harakati haqida ma'lumot",
  ],
};

// ── Utils ─────────────────────────────────────────────────────────────────────

function uid(): string { return Math.random().toString(36).slice(2); }
function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function toLang(lang: string): string {
  if (lang === "en") return "english";
  if (lang === "qq") return "karakalpak";
  if (lang === "ru") return "russian";
  return "uzbek";
}

// ── AI Avatar ─────────────────────────────────────────────────────────────────

function AIAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm"
    ? "w-7 h-7 text-xs"
    : "w-9 h-9 text-sm";
  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20", cls)}>
      <Sparkles className="w-[45%] h-[45%] text-white" />
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === "user") {
    return (
      <div className="flex justify-end px-4 sm:px-6">
        <div className="max-w-[75%] sm:max-w-[65%] flex flex-col items-end gap-1">
          {msg.attachmentName && (
            <div className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl bg-indigo-900/60 border border-indigo-700/50 text-indigo-300">
              <Paperclip className="w-3 h-3" />
              {msg.attachmentName}
            </div>
          )}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-lg shadow-indigo-500/20">
            {msg.content}
          </div>
          <span className="text-[10px] text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 sm:px-6 group">
      <AIAvatar />
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <div className="prose-ai">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-violet-300 mb-2 mt-3 flex items-center gap-1.5"><span className="w-1 h-4 bg-violet-500 rounded-full inline-block" />{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-indigo-300 mb-1.5 mt-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-slate-200 leading-relaxed mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                ul: ({ children }) => <ul className="my-2 space-y-1 pl-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 space-y-1 pl-1 list-decimal list-inside">{children}</ol>,
                li: ({ children }) => (
                  <li className="text-sm text-slate-200 leading-relaxed flex gap-2">
                    <span className="text-violet-400 mt-1 flex-shrink-0">▸</span>
                    <span>{children}</span>
                  </li>
                ),
                code: ({ className, children }) => {
                  const isBlock = String(className ?? "").startsWith("language-");
                  return isBlock ? (
                    <pre className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 overflow-x-auto my-2">
                      <code className="text-emerald-300 text-xs font-mono">{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-slate-700 text-emerald-300 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-violet-500 pl-3 my-2 text-slate-400 italic text-sm">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="bg-slate-700 text-slate-200 font-semibold px-3 py-2 text-left border border-slate-600">{children}</th>,
                td: ({ children }) => <td className="text-slate-300 px-3 py-2 border border-slate-700">{children}</td>,
                hr: () => <hr className="border-slate-700 my-3" />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Nusxalandi" : "Nusxa olish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Welcome state ─────────────────────────────────────────────────────────────

function WelcomeState({
  subject,
  contextLesson,
  onSuggestion,
}: {
  subject: Subject;
  contextLesson: string;
  onSuggestion: (q: string) => void;
}) {
  const sub = SUBJECTS.find((s) => s.value === subject)!;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">AI Tutor</h2>
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        {contextLesson
          ? <>Siz hozir <span className="text-indigo-400 font-semibold">«{contextLesson}»</span> mavzusini o'rganmoqdasiz. Savolingizni bering!</>
          : <>Men sizning shaxsiy AI o'qituvchingizman. <span className={cn("font-semibold bg-gradient-to-r bg-clip-text text-transparent", sub.gradient)}>{sub.emoji} {sub.label}</span> bo'yicha istalgan savolni bering!</>
        }
      </p>

      {/* Capability chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { icon: <Brain className="w-3.5 h-3.5" />, label: "Batafsil tushuntirish" },
          { icon: <Zap className="w-3.5 h-3.5" />, label: "Misol va mashqlar" },
          { icon: <GraduationCap className="w-3.5 h-3.5" />, label: "BMBA tayyorgarligi" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3.5 py-1.5 text-xs text-slate-300">
            <span className="text-violet-400">{c.icon}</span>
            {c.label}
          </div>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {SUGGESTIONS[subject].map((q) => (
          <button
            key={q}
            onClick={() => onSuggestion(q)}
            className="text-left bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-violet-500/50 rounded-xl px-4 py-3 text-xs text-slate-300 hover:text-white transition-all leading-snug group"
          >
            <Bot className="w-3 h-3 text-slate-500 group-hover:text-violet-400 mb-1.5 transition-colors" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 sm:px-6">
      <AIAvatar />
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

function AiTutorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, tr } = useLang();

  const contextSubject = (searchParams.get("subject") as Subject | null) ?? "MATHEMATICS";
  const contextLesson  = searchParams.get("lesson") ?? "";
  const contextQ       = searchParams.get("q") ?? "";

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  // ── State ──────────────────────────────────────────────────────────────────

  const [subject, setSubject] = useState<Subject>(contextSubject);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(contextQ);
  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorSettings] = useState<TutorSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ai-tutor-settings");
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return { personality: "friendly", language: lang, responseLength: "medium" };
  });

  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const currentSubject = SUBJECTS.find((s) => s.value === subject)!;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when subject changes
  useEffect(() => {
    setMessages([]);
  }, [subject]);

  // ── Chat mutation ──────────────────────────────────────────────────────────

  const chatMutation = useMutation({
    mutationFn: async ({ question, attachText }: { question: string; attachText?: string }) => {
      const fullQuestion = attachText
        ? `${question}\n\n[Biriktirilgan fayl:\n${attachText}]`
        : question;

      const personalityMap: Record<TutorPersonality, string> = {
        academic: "[Akademik uslub: rasmiy, batafsil, ilmiy terminologiya bilan javob ber.] ",
        friendly: "[Do'stona uslub: qisqa, sodda, misollar bilan tushuntir.] ",
        concise:  "[Qisqa uslub: faqat asosiy fikrni ayt, 2-3 gapdan oshmasin.] ",
      };
      const lengthMap = {
        short:  " [Javobni 1-2 gapda ber.]",
        medium: "",
        long:   " [Batafsil, keng tushuntirma ber.]",
      };

      const enhancedQ = personalityMap[tutorSettings.personality] + fullQuestion + lengthMap[tutorSettings.responseLength];

      const res = await api.post("/ai/chat", {
        question: enhancedQ,
        subject,
        lesson_id: null,
        language: toLang(tutorSettings.language),
      });
      return res.data as TutorResponse;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "ai", content: data.answer, timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "ai", content: "Uzr, xatolik yuz berdi. Iltimos qayta urinib ko'ring.", timestamp: new Date() },
      ]);
    },
  });

  // ── Send handler ───────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: trimmed,
      attachmentName: attachment?.name,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    chatMutation.mutate({ question: trimmed, attachText: attachment?.content });
    setAttachment(null);
  }, [input, chatMutation, attachment]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File attachment ────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setAttachment({ name: file.name, content: `[Rasm biriktirildi: ${file.name}]` });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? "";
        setAttachment({ name: file.name, content: text.slice(0, 3000) });
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  // ── Voice input ────────────────────────────────────────────────────────────

  const toggleRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { alert("Brauzeringiz ovoz tanishni qo'llab-quvvatlamaydi."); return; }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = tutorSettings.language === "ru" ? "ru-RU" : "uz-UZ";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  // ── Clear chat ─────────────────────────────────────────────────────────────

  const clearChat = () => setMessages([]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden text-white">

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 transition-transform duration-300",
        "fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo / back */}
        <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-800">
          <Link href="/dashboard"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(false)}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">AI Tutor</span>
          </div>
          <button className="lg:hidden p-1 text-slate-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subject selector */}
        <div className="px-3 py-3 border-b border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Fan</p>
          <div className="space-y-0.5">
            {SUBJECTS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setSubject(s.value); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                  s.value === subject
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <span className="text-base">{s.emoji}</span>
                <span>{s.label}</span>
                {s.value === subject && (
                  <div className={cn("ml-auto w-2 h-2 rounded-full bg-gradient-to-br", s.gradient)} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Tez savollar</p>
          <div className="space-y-1">
            {SUGGESTIONS[subject].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); setSidebarOpen(false); textareaRef.current?.focus(); }}
                className="w-full text-left text-xs text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 rounded-xl px-3 py-2.5 transition-all leading-snug"
              >
                <Bot className="w-3 h-3 inline mr-1.5 text-slate-600" />
                {q}
              </button>
            ))}
          </div>

          {contextLesson && (
            <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Dars konteksti</p>
              <div className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-300 leading-snug">{contextLesson}</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings link */}
        <div className="px-3 py-3 border-t border-slate-800">
          <Link href="/ai-tutor/settings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Settings className="w-4 h-4" />
            Tutor sozlamalari
          </Link>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-20">
          <div className="px-4 h-14 flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Subject badge */}
            <div className="relative">
              <button
                onClick={() => setSubjectOpen((o) => !o)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition-colors"
              >
                <span>{currentSubject.emoji}</span>
                <span className="hidden sm:inline">{currentSubject.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {subjectOpen && (
                <div className="absolute left-0 top-full mt-1.5 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 py-1.5 w-48">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setSubject(s.value); setSubjectOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left",
                        s.value === subject ? "font-bold text-white" : "text-slate-300"
                      )}
                    >
                      <span>{s.emoji}</span> {s.label}
                      {s.value === subject && <Check className="w-3.5 h-3.5 ml-auto text-violet-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            {hasMessages && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tozalash</span>
              </button>
            )}
            <Link href="/ai-tutor/settings"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <WelcomeState
              subject={subject}
              contextLesson={contextLesson}
              onSuggestion={(q) => {
                setInput(q);
                textareaRef.current?.focus();
              }}
            />
          ) : (
            <div className="py-6 space-y-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {chatMutation.isPending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
          {hasMessages && chatMutation.isPending && <div ref={bottomRef} />}
        </div>

        {/* ── Input area ────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 p-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-3xl mx-auto">

            {/* Attachment preview */}
            {attachment && (
              <div className="flex items-center gap-2 mb-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3.5 py-2.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-xs text-indigo-300 font-medium flex-1 truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="text-indigo-400 hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input box */}
            <div className="flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-2 py-2 focus-within:border-violet-500/60 focus-within:bg-slate-800 transition-all shadow-xl shadow-black/20">
              {/* File attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0 mb-0.5"
                title="Fayl biriktirish"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden"
                accept="image/*,.txt,.pdf,.doc,.docx,.md"
                onChange={handleFileChange} />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr("ai_tutor_placeholder") || "Savolingizni yozing..."}
                rows={1}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder-slate-500 focus:outline-none max-h-36 overflow-y-auto leading-relaxed"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 144) + "px";
                }}
              />

              {/* Voice */}
              <button
                onClick={toggleRecording}
                className={cn(
                  "p-2 rounded-xl flex-shrink-0 transition-all mb-0.5",
                  recording
                    ? "text-red-400 bg-red-500/20 animate-pulse"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                )}
                title={recording ? "To'xtatish" : "Ovozli yozish"}
              >
                {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !attachment) || chatMutation.isPending}
                className={cn(
                  "p-2.5 rounded-xl flex-shrink-0 transition-all mb-0.5 shadow-lg",
                  input.trim() && !chatMutation.isPending
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/30"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                )}
              >
                {chatMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Send className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-[10px] text-slate-600 text-center mt-2">
              Enter = yuborish · Shift+Enter = yangi qator · AI xato qilishi mumkin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AiTutorPage />
    </Suspense>
  );
}
