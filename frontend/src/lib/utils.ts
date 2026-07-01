import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Subject, SubjectInfo } from "@/types";

// ── Tailwind class merge utility ──────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Score formatting ──────────────────────────────────────────────────────────

export function formatScore(score: number, maxScore = 33.0): string {
  return `${score.toFixed(1)} / ${maxScore.toFixed(1)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatScoreDisplay(score: number): string {
  return score.toFixed(1);
}

// ── Subject helpers ───────────────────────────────────────────────────────────

export const SUBJECT_INFO: Record<Subject, SubjectInfo> = {
  MOTHER_TONGUE: {
    key: "MOTHER_TONGUE",
    label: "Ona tili va adabiyot",
    label_ru: "Родной язык и литература",
    color: "blue",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
    textColor: "text-blue-700",
  },
  MATHEMATICS: {
    key: "MATHEMATICS",
    label: "Matematika",
    label_ru: "Математика",
    color: "green",
    bgColor: "bg-green-100",
    borderColor: "border-green-400",
    textColor: "text-green-700",
  },
  HISTORY: {
    key: "HISTORY",
    label: "O'zbekiston tarixi",
    label_ru: "История Узбекистана",
    color: "orange",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-400",
    textColor: "text-orange-700",
  },
};

export function getSubjectInfo(subject: Subject): SubjectInfo {
  return SUBJECT_INFO[subject];
}

export function getSubjectColor(subject: Subject): string {
  return SUBJECT_INFO[subject].color;
}

export function getSubjectLabel(subject: Subject, lang: "uz" | "ru" = "uz"): string {
  return lang === "ru" ? SUBJECT_INFO[subject].label_ru : SUBJECT_INFO[subject].label;
}

// ── Level computation ─────────────────────────────────────────────────────────

const XP_PER_LEVEL = 500;

export function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpInCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpInCurrentLevel(xp);
}

export function levelProgressPercent(xp: number): number {
  return (xpInCurrentLevel(xp) / XP_PER_LEVEL) * 100;
}

// ── Grade label ───────────────────────────────────────────────────────────────

export function getGradeColor(gradeLabel: string): string {
  switch (gradeLabel) {
    case "A'lo":
      return "text-green-600";
    case "Yaxshi":
      return "text-blue-600";
    case "Qoniqarli":
      return "text-yellow-600";
    default:
      return "text-red-600";
  }
}

// ── Timer formatting ──────────────────────────────────────────────────────────

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function isTimerCritical(seconds: number): boolean {
  return seconds <= 5 * 60; // last 5 minutes
}

export function isTimerWarning(seconds: number): boolean {
  return seconds <= 10 * 60; // last 10 minutes
}

// ── Date formatting ───────────────────────────────────────────────────────────

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Difficulty label ──────────────────────────────────────────────────────────

export function getDifficultyLabel(difficulty: string, lang: "uz" | "ru" = "uz"): string {
  const labels: Record<string, { uz: string; ru: string }> = {
    EASY:   { uz: "Oson",    ru: "Лёгкий"   },
    MEDIUM: { uz: "O'rta",   ru: "Средний"  },
    HARD:   { uz: "Qiyin",   ru: "Сложный"  },
  };
  return labels[difficulty]?.[lang] ?? difficulty;
}

// ── Option helpers ────────────────────────────────────────────────────────────

export function getOptionText(
  question: { option_a: string; option_b: string; option_c: string; option_d: string },
  option: "A" | "B" | "C" | "D"
): string {
  const map = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };
  return map[option];
}
