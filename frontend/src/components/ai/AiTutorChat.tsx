"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SUBJECT_INFO } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import type { Subject } from "@/types";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AiTutorChatProps {
  subject: Subject;
  lessonId?: number;
  lessonTitle?: string;
  language?: string;
}

interface TutorChatResponse {
  answer: string;
  subject: string;
  model_used: string;
}

// Map UI lang code to backend language string
function toBackendLang(lang: string): string {
  if (lang === "en") return "english";
  if (lang === "qq") return "karakalpak (Qaraqalpaq tili)";
  if (lang === "ru") return "russian";
  return "uzbek";
}

export default function AiTutorChat({
  subject,
  lessonId,
  lessonTitle,
  language: languageProp,
}: AiTutorChatProps) {
  const { lang: globalLang, tr } = useLang();
  const language = languageProp ?? globalLang;

  const getWelcomeMessage = () => {
    const topicPart = lessonTitle ? ` "${lessonTitle}" — ` : " ";
    if (language === "ru") {
      return `Привет! Я AbituriyentAI — ваш личный ИИ-репетитор.${topicPart}О чём вы хотите спросить?`;
    }
    if (language === "en") {
      return `Hello! I'm AbituriyentAI — your personal AI tutor.${topicPart}What would you like to ask?`;
    }
    if (language === "qq") {
      return `Sálem! Men AbituriyentAI — sızdıń shaxsiy AI ustazyńızman.${topicPart}Ne sorawıńız bar?`;
    }
    return `Salom! Men AbituriyentAI — sizning shaxsiy AI o'qituvchingizman.${topicPart}Nima so'rashingiz mumkin?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const subjectColor = SUBJECT_INFO[subject];

  const chatMutation = useMutation({
    mutationFn: async (question: string): Promise<TutorChatResponse> => {
      const res = await api.post("/ai/chat", {
        question,
        subject,
        lesson_id: lessonId ?? null,
        language: toBackendLang(language),
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.answer, timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: tr("try_again"),
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, timestamp: new Date() },
    ]);
    setInput("");
    chatMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTED_QUESTIONS: Record<string, Record<Subject, string[]>> = {
    uz: {
      MOTHER_TONGUE: [
        "Fe'lning zamonlari qanday?",
        "Sifat darajalari haqida tushuntiring",
        "Ega va kesim nima?",
      ],
      MATHEMATICS: [
        "Kvadrat tenglama formulasini tushuntiring",
        "Logarifm nima?",
        "Trigonometrik funksiyalar haqida",
      ],
      HISTORY: [
        "Amir Temur saltanati qachon tuzilgan?",
        "Mustaqillik qachon e'lon qilindi?",
        "Yangi O'zbekiston strategiyasi nima?",
      ],
    },
    ru: {
      MOTHER_TONGUE: [
        "Времена глагола",
        "Степени сравнения прилагательных",
        "Подлежащее и сказуемое",
      ],
      MATHEMATICS: [
        "Формула квадратного уравнения",
        "Что такое логарифм?",
        "Тригонометрические функции",
      ],
      HISTORY: [
        "Когда образовалось государство Тимуридов?",
        "Когда была объявлена независимость?",
        "Стратегия «Новый Узбекистан»",
      ],
    },
    en: {
      MOTHER_TONGUE: [
        "What are verb tenses?",
        "Explain adjective degrees",
        "What are subject and predicate?",
      ],
      MATHEMATICS: [
        "Explain the quadratic formula",
        "What is a logarithm?",
        "Tell me about trigonometric functions",
      ],
      HISTORY: [
        "When was the Timurid state founded?",
        "When was independence declared?",
        "What is the New Uzbekistan strategy?",
      ],
    },
    qq: {
      MOTHER_TONGUE: [
        "Fe'l zamanları qanday?",
        "Sıpat dárejeleri haqqında",
        "Iye hám bayan neme?",
      ],
      MATHEMATICS: [
        "Kvadrat teńleme formulasın túsindiriń",
        "Logarifm neme?",
        "Trigonometriyalıq funksiyalar",
      ],
      HISTORY: [
        "Ámir Temur dáwleti qashan qurilǵan?",
        "Ózbekistan qashan mustaqıl boldı?",
        "Jańa Ózbekistan strategiyası neme?",
      ],
    },
  };

  const langKey = (["uz", "ru", "en", "qq"].includes(language)) ? language : "uz";
  const suggestions = SUGGESTED_QUESTIONS[langKey]?.[subject] ?? SUGGESTED_QUESTIONS.uz[subject] ?? [];

  return (
    <div className="flex flex-col h-[420px] sm:h-[520px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 ${subjectColor.bgColor}`}
      >
        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <p className={`text-sm font-semibold ${subjectColor.textColor}`}>
            {tr("ai_tutor")}
          </p>
          <p className="text-xs text-gray-500">
            AbituriyentAI · {lessonTitle ?? subject}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
              🤖
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (shown when empty after greeting) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2">
            {tr("ai_chat_placeholder", "...")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-full px-3 py-1 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tr("ai_chat_placeholder")}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent max-h-28 overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
          className="shrink-0 w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={tr("ai_send")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
