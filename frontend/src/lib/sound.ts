/**
 * Lightweight game sound engine — synthesized via the Web Audio API.
 * No audio files, no network, no latency. Respects a user mute preference
 * stored in localStorage ("ab_sound_muted").
 */

type SoundName =
  | "click"      // UI tap / select
  | "correct"    // right answer
  | "wrong"      // wrong answer
  | "win"        // level / game complete
  | "lose"       // game over
  | "flip"       // card flip / reveal
  | "tick"       // countdown tick
  | "coin"       // reward earned
  | "whoosh";    // transition / streak

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    _ctx = new AC();
  }
  // Autoplay policies suspend the context until a user gesture — resume on demand.
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ab_sound_muted") === "1";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ab_sound_muted", muted ? "1" : "0");
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

/** Play a single tone. */
function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.18,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

/** Frequency glide (for whoosh / lose). */
function glide(
  ac: AudioContext,
  from: number,
  to: number,
  start: number,
  dur: number,
  type: OscillatorType = "sawtooth",
  gain = 0.14,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ac.currentTime + start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), ac.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

/**
 * Play a named sound effect. Safe to call anywhere — no-ops on the server,
 * when unsupported, or when muted.
 */
export function playSound(name: SoundName): void {
  if (isSoundMuted()) return;
  const ac = ctx();
  if (!ac) return;

  try {
    switch (name) {
      case "click":
        tone(ac, 520, 0, 0.06, "triangle", 0.12);
        break;
      case "correct":
        // rising major arpeggio
        tone(ac, 660, 0, 0.1, "sine", 0.16);
        tone(ac, 880, 0.08, 0.12, "sine", 0.16);
        tone(ac, 1175, 0.16, 0.16, "sine", 0.14);
        break;
      case "wrong":
        tone(ac, 220, 0, 0.18, "square", 0.12);
        tone(ac, 160, 0.1, 0.22, "square", 0.12);
        break;
      case "win":
        tone(ac, 523, 0, 0.12, "sine", 0.18);
        tone(ac, 659, 0.12, 0.12, "sine", 0.18);
        tone(ac, 784, 0.24, 0.12, "sine", 0.18);
        tone(ac, 1047, 0.36, 0.28, "sine", 0.2);
        break;
      case "lose":
        glide(ac, 440, 110, 0, 0.6, "sawtooth", 0.14);
        break;
      case "flip":
        tone(ac, 400, 0, 0.05, "triangle", 0.1);
        tone(ac, 640, 0.05, 0.07, "triangle", 0.1);
        break;
      case "tick":
        tone(ac, 900, 0, 0.03, "square", 0.08);
        break;
      case "coin":
        tone(ac, 988, 0, 0.07, "square", 0.14);
        tone(ac, 1319, 0.06, 0.14, "square", 0.14);
        break;
      case "whoosh":
        glide(ac, 300, 1200, 0, 0.25, "sine", 0.1);
        break;
    }
  } catch {
    /* ignore audio errors */
  }
}
