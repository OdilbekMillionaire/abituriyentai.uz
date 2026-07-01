"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Lang, getTr } from "./translations";

export type { Lang };

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: string, fallback?: string) => string;
  /** Legacy 2/4 arg helper — use tr() for new code */
  t: (uz: string, ru: string, en?: string, qq?: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "uz",
  setLang: () => {},
  tr: (key) => key,
  t: (uz) => uz,
});

const STORAGE_KEY = "abituriyent_lang";
const VALID_LANGS: Lang[] = ["uz", "ru", "en", "qq"];

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && VALID_LANGS.includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  const tr = getTr(lang);

  function t(uz: string, ru: string, en?: string, qq?: string): string {
    if (lang === "ru") return ru;
    if (lang === "en") return en ?? uz;
    if (lang === "qq") return qq ?? uz;
    return uz;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, tr, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
