const PREFIX = "game_best_";

export function getPersonalBest(gameKey: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${PREFIX}${gameKey}`);
  if (!raw) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

export function saveScore(gameKey: string, score: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getPersonalBest(gameKey);
  if (current === null || score > current) {
    localStorage.setItem(`${PREFIX}${gameKey}`, String(score));
    return true; // new record
  }
  return false;
}

export function clearPersonalBest(gameKey: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`${PREFIX}${gameKey}`);
  }
}
