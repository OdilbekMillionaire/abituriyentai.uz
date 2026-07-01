"use client";

import { useLang } from "@/lib/lang";
import { LANG_META, type Lang } from "@/lib/translations";

const LANGS: Lang[] = ["uz", "ru", "en", "qq"];

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={`flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold gap-0.5 ${className ?? ""}`}>
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          title={LANG_META[l].nativeName}
          className={`px-2 py-1 rounded-full transition-colors ${
            lang === l
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {LANG_META[l].label}
        </button>
      ))}
    </div>
  );
}
